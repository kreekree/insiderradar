// api/insider.js — Fetch Form 4 insider trades for a given issuer CIK
//
// Strategy: use EDGAR EFTS full-text search to find Form 4 filings that
// contain the issuer's CIK, then parse each filing's XML for transactions.
// The first 10 digits of an accession number are always the filer's CIK,
// so we can construct exact Archives URLs without any HTML/Atom parsing.

const UA = 'InsiderRadar contact@insiderradar.com';

const TX_CODE = {
  P: 'BUY', S: 'SELL', A: 'AWARD', D: 'DISPOSE',
  F: 'TAX_WITHHOLD', M: 'OPTION_EXERCISE', G: 'GIFT', I: 'INHERIT'
};

function xmlVal(xml, tag) {
  const m1 = xml.match(new RegExp(`<${tag}[^>]*>\\s*<value>([^<]+)<\\/value>`, 'i'));
  if (m1) return m1[1].trim();
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

// Step 1: EFTS full-text search for Form 4 filings mentioning this CIK
async function getForm4Filings(cikPadded) {
  const startdt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  // Quote the CIK for exact-phrase match — issuer CIK appears verbatim in Form 4 XML
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22${cikPadded}%22&forms=4&dateRange=custom&startdt=${startdt}&from=0&size=20`;
  console.log('[insider] EFTS URL:', url);

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`EFTS search failed: ${res.status}`);
  const data = await res.json();

  const hits = data.hits?.hits || [];
  console.log('[insider] EFTS hits:', hits.length);
  if (hits.length > 0) console.log('[insider] Sample hit:', JSON.stringify(hits[0]).substring(0, 300));

  return hits.map(hit => {
    // _id is the accession number, e.g. "0001234567-24-001234"
    const accNo = hit._id;
    const accNoDashes = accNo.replace(/-/g, '');
    // First 10 chars of accNoDashes = padded filer CIK (the insider who filed)
    const filerCikPadded = accNoDashes.substring(0, 10);
    const filerCik = filerCikPadded.replace(/^0+/, '') || filerCikPadded;
    const date = hit._source?.file_date || hit._source?.period_of_report || '';

    return {
      href: `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${accNo}-index.htm`,
      filerCik,
      accNoDashes,
      accNo,
      date
    };
  });
}

// Step 2: From filing index URL, find the XML document URL
async function getXmlUrlFromIndex(filing) {
  const jsonUrl = `https://www.sec.gov/Archives/edgar/data/${filing.filerCik}/${filing.accNoDashes}/${filing.accNo}-index.json`;
  console.log('[insider] index.json:', jsonUrl);

  try {
    const res = await fetch(jsonUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.log('[insider] index.json failed:', res.status);
      // Fallback: try the .htm index and derive XML path from accession number
      return `https://www.sec.gov/Archives/edgar/data/${filing.filerCik}/${filing.accNoDashes}/${filing.accNo}.xml`;
    }
    const idx = await res.json();
    const items = idx.directory?.item || [];
    console.log('[insider] items:', items.map(i => i.name).join(', '));

    // Prefer the primary Form 4 XML (not index, not R-prefixed XBRL files)
    const xmlFile = items.find(f =>
      f.name.endsWith('.xml') &&
      !f.name.toLowerCase().includes('index') &&
      !f.name.match(/^R\d/)
    );
    if (!xmlFile) return null;

    const base = `https://www.sec.gov/Archives/edgar/data/${filing.filerCik}/${filing.accNoDashes}/`;
    return base + xmlFile.name;
  } catch (e) {
    console.log('[insider] index.json error:', e.message);
    return null;
  }
}

// Step 3: Parse transaction data from Form 4 XML
async function parseForm4Xml(xmlUrl, filingDate) {
  try {
    const res = await fetch(xmlUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.log('[insider] XML fetch failed:', res.status, xmlUrl);
      return [];
    }
    const xml = await res.text();

    const ownerName    = xmlVal(xml, 'rptOwnerName') || 'Unknown';
    const isOfficer    = xml.includes('<isOfficer>1</isOfficer>');
    const isDirector   = xml.includes('<isDirector>1</isDirector>');
    const officerTitle = isOfficer
      ? (xmlVal(xml, 'officerTitle') || 'Officer')
      : isDirector ? 'Director' : 'Other';
    const issuerTicker = xmlVal(xml, 'issuerTradingSymbol') || '';
    const period       = xmlVal(xml, 'periodOfReport') || filingDate;

    const blocks = xmlBlocks(xml, 'nonDerivativeTransaction');
    console.log('[insider]', ownerName, '→', blocks.length, 'nonDerivative blocks');

    const transactions = [];
    for (const block of blocks) {
      const code        = xmlVal(block, 'transactionCode') || '';
      const shares      = parseFloat(xmlVal(block, 'transactionShares') || '0');
      const price       = parseFloat(xmlVal(block, 'transactionPricePerShare') || '0');
      const date        = xmlVal(block, 'transactionDate') || period;
      const sharesAfter = parseFloat(xmlVal(block, 'sharesOwnedFollowingTransaction') || '0');
      const security    = xmlVal(block, 'securityTitle') || 'Common Stock';
      const acqDisp     = xmlVal(block, 'transactionAcquiredDisposedCode') || '';

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
  } catch (e) {
    console.log('[insider] parseForm4Xml error:', e.message);
    return [];
  }
}

export default async function handler(req, res) {
  const cik = (req.query.cik || '').replace(/^0+/, '');

  if (!cik || !/^\d+$/.test(cik)) {
    return res.status(400).json({ error: 'cik query parameter required (numeric)' });
  }

  const cikPadded = cik.padStart(10, '0');
  console.log('[insider] handler for CIK:', cikPadded);

  try {
    const [subRes, filings] = await Promise.all([
      fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, {
        headers: { 'User-Agent': UA }
      }),
      getForm4Filings(cikPadded)
    ]);

    if (!subRes.ok) throw new Error('SEC submissions fetch failed');
    const sub = await subRes.json();

    console.log('[insider]', sub.name, '— processing', filings.length, 'filings');

    const results = await Promise.all(
      filings.map(async f => {
        try {
          const xmlUrl = await getXmlUrlFromIndex(f);
          if (!xmlUrl) return [];
          return await parseForm4Xml(xmlUrl, f.date);
        } catch (e) {
          console.log('[insider] filing error:', e.message);
          return [];
        }
      })
    );

    const trades = results.flat().sort((a, b) => (b.date > a.date ? 1 : -1));
    console.log('[insider] total trades:', trades.length);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({
      company: sub.name,
      cik,
      ticker: sub.tickers?.[0] || '',
      trades
    });
  } catch (err) {
    console.error('[insider] error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch insider trades' });
  }
}
