// api/insider.js — Fetch Form 4 insider trades for a given CIK
// Uses the filing index JSON to reliably find the XML document,
// rather than trusting primaryDocument (which can be .htm / iXBRL)

const UA = 'InsiderRadar contact@insiderradar.com';

function xmlVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>\\s*<value>([^<]+)<\\/value>`, 'i'));
  if (m) return m[1].trim();
  // fallback: direct tag content (no nested <value>)
  const m2 = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, 'i'));
  return m2 ? m2[1].trim() : null;
}

function xmlBlocks(xml, tag) {
  const blocks = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);
  return blocks;
}

const TX_CODE = {
  P: 'BUY', S: 'SELL', A: 'AWARD', D: 'DISPOSE',
  F: 'TAX_WITHHOLD', M: 'OPTION_EXERCISE', G: 'GIFT', I: 'INHERIT'
};

// Find the real XML document URL from the filing index JSON
async function getXmlUrl(cikNum, accession) {
  const accNoDashes = accession.replace(/-/g, '');
  const indexUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoDashes}/index.json`;

  try {
    const res = await fetch(indexUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const idx = await res.json();

    // Find the Form 4 XML file — prefer files ending in .xml, exclude index files
    const items = idx.directory?.item || [];
    const xmlFile = items.find(f =>
      f.name.endsWith('.xml') &&
      !f.name.includes('index') &&
      !f.name.startsWith('R') // exclude XBRL viewer files
    );
    if (!xmlFile) return null;

    return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoDashes}/${xmlFile.name}`;
  } catch {
    return null;
  }
}

async function parseForm4(cikNum, accession, filingDate) {
  const xmlUrl = await getXmlUrl(cikNum, accession);
  if (!xmlUrl) return [];

  try {
    const res = await fetch(xmlUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) return [];
    const xml = await res.text();

    // Owner info
    const ownerName = xmlVal(xml, 'rptOwnerName') || 'Unknown';
    const isOfficer  = xml.includes('<isOfficer>1</isOfficer>');
    const isDirector = xml.includes('<isDirector>1</isDirector>');
    const officerTitle = isOfficer
      ? (xmlVal(xml, 'officerTitle') || 'Officer')
      : isDirector ? 'Director' : 'Other';

    const issuerTicker = xmlVal(xml, 'issuerTradingSymbol') || '';
    const periodOfReport = xmlVal(xml, 'periodOfReport') || filingDate;

    const transactions = [];

    for (const block of xmlBlocks(xml, 'nonDerivativeTransaction')) {
      const code   = xmlVal(block, 'transactionCode') || '';
      const shares = parseFloat(xmlVal(block, 'transactionShares') || '0');
      const price  = parseFloat(xmlVal(block, 'transactionPricePerShare') || '0');
      const date   = xmlVal(block, 'transactionDate') || periodOfReport;
      const sharesAfter = parseFloat(xmlVal(block, 'sharesOwnedFollowingTransaction') || '0');
      const security = xmlVal(block, 'securityTitle') || 'Common Stock';
      const acqDisp  = xmlVal(block, 'transactionAcquiredDisposedCode') || '';

      if (!shares) continue;

      transactions.push({
        ownerName,
        title: officerTitle,
        ticker: issuerTicker,
        date,
        code,
        label: TX_CODE[code] || code,
        shares,
        price,
        value: Math.round(shares * price),
        sharesAfter,
        security,
        acqDisp
      });
    }

    return transactions;
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  const cik = (req.query.cik || '').replace(/^0+/, '');

  if (!cik || !/^\d+$/.test(cik)) {
    return res.status(400).json({ error: 'cik query parameter required (numeric)' });
  }

  const cikPadded = cik.padStart(10, '0');

  try {
    const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, {
      headers: { 'User-Agent': UA }
    });
    if (!subRes.ok) throw new Error('SEC submissions fetch failed');
    const sub = await subRes.json();

    const { accessionNumber, form, filingDate } = sub.filings.recent;

    // Collect up to 15 most recent Form 4s (include 4/A amendments too)
    const form4s = [];
    for (let i = 0; i < form.length && form4s.length < 15; i++) {
      if (form[i] === '4' || form[i] === '4/A') {
        form4s.push({ accession: accessionNumber[i], date: filingDate[i] });
      }
    }

    // Parse in parallel
    const results = await Promise.all(
      form4s.map(f => parseForm4(cik, f.accession, f.date).catch(() => []))
    );

    const trades = results.flat().sort((a, b) => (b.date > a.date ? 1 : -1));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({
      company: sub.name,
      cik,
      ticker: sub.tickers?.[0] || '',
      trades
    });
  } catch (err) {
    console.error('insider error:', err);
    return res.status(500).json({ error: 'Failed to fetch insider trades' });
  }
}
