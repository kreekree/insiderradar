// api/insider.js — Fetch Form 4 insider trades for a given CIK
// Returns last 50 transactions parsed from SEC EDGAR XML filings

const UA = 'InsiderRadar contact@insiderradar.com';

// Extract first match of an XML tag value pattern: <tag><value>X</value></tag>
function xmlVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>\\s*<value>([^<]+)<\\/value>`, 'i'));
  return m ? m[1].trim() : null;
}

// Extract all blocks between <tag>...</tag>
function xmlBlocks(xml, tag) {
  const blocks = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);
  return blocks;
}

// Map transaction codes to human-readable labels
const TX_CODE = {
  P: 'BUY', S: 'SELL', A: 'AWARD', D: 'DISPOSE',
  F: 'TAX_WITHHOLD', M: 'OPTION_EXERCISE', G: 'GIFT', I: 'INHERIT'
};

async function parseForm4(cikNum, accession, primaryDoc) {
  const accNoDashes = accession.replace(/-/g, '');
  const url = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoDashes}/${primaryDoc}`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const xml = await res.text();

  // Owner info (may have multiple reporters; take first)
  const ownerName = xmlVal(xml, 'rptOwnerName') || 'Unknown';
  const isOfficer = xml.includes('<isOfficer>1</isOfficer>');
  const isDirector = xml.includes('<isDirector>1</isDirector>');
  const officerTitle = isOfficer
    ? (xmlVal(xml, 'officerTitle') || 'Officer')
    : isDirector ? 'Director' : 'Other';

  const issuerTicker = xmlVal(xml, 'issuerTradingSymbol') || '';
  const filingDate = xmlVal(xml, 'periodOfReport') || '';

  const transactions = [];

  // Non-derivative transactions (open market buys/sells)
  for (const block of xmlBlocks(xml, 'nonDerivativeTransaction')) {
    const code = xmlVal(block, 'transactionCode') || '';
    const shares = parseFloat(xmlVal(block, 'transactionShares') || '0');
    const price = parseFloat(xmlVal(block, 'transactionPricePerShare') || '0');
    const acqDisp = xmlVal(block, 'transactionAcquiredDisposedCode') || '';
    const date = xmlVal(block, 'transactionDate') || filingDate;
    const sharesAfter = parseFloat(xmlVal(block, 'sharesOwnedFollowingTransaction') || '0');
    const security = xmlVal(block, 'securityTitle') || 'Common Stock';

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
}

export default async function handler(req, res) {
  const cik = (req.query.cik || '').replace(/^0+/, ''); // strip leading zeros for URL

  if (!cik || !/^\d+$/.test(cik)) {
    return res.status(400).json({ error: 'cik query parameter required (numeric)' });
  }

  const cikPadded = cik.padStart(10, '0');

  try {
    // Fetch company submissions index
    const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, {
      headers: { 'User-Agent': UA }
    });
    if (!subRes.ok) throw new Error('SEC submissions fetch failed');
    const sub = await subRes.json();

    const { accessionNumber, form, filingDate, primaryDocument } = sub.filings.recent;

    // Collect the most recent Form 4 filing indices (up to 15 to keep under rate limits)
    const form4s = [];
    for (let i = 0; i < form.length && form4s.length < 15; i++) {
      if (form[i] === '4') {
        form4s.push({
          accession: accessionNumber[i],
          date: filingDate[i],
          doc: primaryDocument[i]
        });
      }
    }

    // Fetch and parse each Form 4 in parallel (batched)
    const results = await Promise.all(
      form4s.map(f => parseForm4(cik, f.accession, f.doc).catch(() => []))
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
