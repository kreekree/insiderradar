// api/insider.js — Fetch Form 4 insider trades for a given issuer CIK
//
// EDGAR EFTS _id format: "{accessionNo}:{xmlFilename}"
// e.g. "0001347842-05-000004:edgar.xml"
// _source.ciks[0] = filer (insider) CIK, ciks[1] = issuer CIK

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

// Step 1: Get recent Form 4 filings via EFTS full-text search
async function getForm4Filings(cikPadded) {
  const startdt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22${cikPadded}%22&forms=4&dateRange=custom&startdt=${startdt}&from=0&size=12`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`EFTS: ${res.status}`);
  const data = await res.json();

  const hits = data.hits?.hits || [];

  return hits.map(hit => {
    // _id is "{accNo}:{xmlFilename}" — split on first colon only
    const colonIdx = hit._id.indexOf(':');
    const accNo = colonIdx > 0 ? hit._id.slice(0, colonIdx) : hit._id;
    const xmlFilename = colonIdx > 0 ? hit._id.slice(colonIdx + 1) : null;
    const accNoDashes = accNo.replace(/-/g, '');

    // ciks[0] = filer (the insider who submitted), ciks[1] = issuer (the company)
    const filerCikPadded = (hit._source?.ciks || [])[0] || accNoDashes.slice(0, 10);
    const filerCik = filerCikPadded.replace(/^0+/, '') || filerCikPadded;

    const date = hit._source?.file_date || hit._source?.period_ending || '';

    const xmlUrl = xmlFilename
      ? `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${xmlFilename}`
      : null;

    return { filerCik, accNoDashes, accNo, xmlUrl, date };
  });
}

// Step 2: Parse Form 4 XML for transactions
async function parseForm4Xml(xmlUrl, filingDate) {
  try {
    const res = await fetch(xmlUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) return [];
    const xml = await res.text();

    const ownerName    = xmlVal(xml, 'rptOwnerName') || 'Unknown';
    const isOfficer    = xml.includes('<isOfficer>1</isOfficer>');
    const isDirector   = xml.includes('<isDirector>1</isDirector>');
    const officerTitle = isOfficer ? (xmlVal(xml, 'officerTitle') || 'Officer')
                       : isDirector ? 'Director' : 'Other';
    const issuerTicker = xmlVal(xml, 'issuerTradingSymbol') || '';
    const period       = xmlVal(xml, 'periodOfReport') || filingDate;

    const blocks = xmlBlocks(xml, 'nonDerivativeTransaction');

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
        ownerName, title: officerTitle, ticker: issuerTicker, date,
        code, label: TX_CODE[code] || code, shares, price,
        value: Math.round(shares * price), sharesAfter, security, acqDisp
      });
    }
    return transactions;
  } catch {
    return [];
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Process in batches to stay under SEC rate limit while being fast
async function processBatched(filings, batchSize = 4, delayMs = 300) {
  const results = [];
  for (let i = 0; i < filings.length; i += batchSize) {
    const batch = filings.slice(i, i + batchSize).filter(f => f.xmlUrl);
    const batchResults = await Promise.all(batch.map(f => parseForm4Xml(f.xmlUrl, f.date)));
    results.push(...batchResults.flat());
    if (i + batchSize < filings.length) await sleep(delayMs);
  }
  return results;
}

export default async function handler(req, res) {
  const cik = (req.query.cik || '').replace(/^0+/, '');
  if (!cik || !/^\d+$/.test(cik)) {
    return res.status(400).json({ error: 'cik required (numeric)' });
  }
  const cikPadded = cik.padStart(10, '0');

  try {
    const [subRes, filings] = await Promise.all([
      fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, { headers: { 'User-Agent': UA } }),
      getForm4Filings(cikPadded)
    ]);
    if (!subRes.ok) throw new Error('submissions fetch failed');
    const sub = await subRes.json();

    // 4 parallel per batch, 300ms between batches — fast but under SEC's 10 req/s limit
    const trades = await processBatched(filings);

    trades.sort((a, b) => (b.date > a.date ? 1 : -1));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({ company: sub.name, cik, ticker: sub.tickers?.[0] || '', trades });
  } catch (err) {
    console.error('insider error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
