import { UA, TX_CODE, xmlVal, xmlBlocks, sleep } from '@/lib/sec';

async function getForm4Filings(cikPadded) {
  const startdt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22${cikPadded}%22&forms=4&dateRange=custom&startdt=${startdt}&from=0&size=12`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`EFTS: ${res.status}`);
  const data = await res.json();

  return (data.hits?.hits || []).map(hit => {
    const colonIdx = hit._id.indexOf(':');
    const accNo = colonIdx > 0 ? hit._id.slice(0, colonIdx) : hit._id;
    const xmlFilename = colonIdx > 0 ? hit._id.slice(colonIdx + 1) : null;
    const accNoDashes = accNo.replace(/-/g, '');
    const filerCikPadded = (hit._source?.ciks || [])[0] || accNoDashes.slice(0, 10);
    const filerCik = filerCikPadded.replace(/^0+/, '') || filerCikPadded;
    const date = hit._source?.file_date || hit._source?.period_ending || '';
    const xmlUrl = xmlFilename
      ? `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${xmlFilename}`
      : null;
    return { filerCik, accNoDashes, accNo, xmlUrl, date };
  });
}

async function parseForm4Xml(xmlUrl, filingDate) {
  try {
    const res = await fetch(xmlUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) return [];
    const xml = await res.text();

    const ownerName    = xmlVal(xml, 'rptOwnerName') || 'Unknown';
    const isOfficer    = xml.includes('<isOfficer>1</isOfficer>');
    const isDirector   = xml.includes('<isDirector>1</isDirector>');
    const officerTitle = isOfficer ? (xmlVal(xml, 'officerTitle') || 'Officer') : isDirector ? 'Director' : 'Other';
    const issuerTicker = xmlVal(xml, 'issuerTradingSymbol') || '';
    const period       = xmlVal(xml, 'periodOfReport') || filingDate;

    const transactions = [];
    for (const block of xmlBlocks(xml, 'nonDerivativeTransaction')) {
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

async function processBatched(filings) {
  const results = [];
  const BATCH = 4;
  for (let i = 0; i < filings.length; i += BATCH) {
    const batch = filings.slice(i, i + BATCH).filter(f => f.xmlUrl);
    const batchResults = await Promise.all(batch.map(f => parseForm4Xml(f.xmlUrl, f.date)));
    results.push(...batchResults.flat());
    if (i + BATCH < filings.length) await sleep(300);
  }
  return results;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cik = (searchParams.get('cik') || '').replace(/^0+/, '');

  if (!cik || !/^\d+$/.test(cik)) return Response.json({ error: 'cik required' }, { status: 400 });
  const cikPadded = cik.padStart(10, '0');

  try {
    const [subRes, filings] = await Promise.all([
      fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, { headers: { 'User-Agent': UA } }),
      getForm4Filings(cikPadded)
    ]);
    if (!subRes.ok) throw new Error('submissions fetch failed');
    const sub = await subRes.json();

    const trades = await processBatched(filings);
    trades.sort((a, b) => (b.date > a.date ? 1 : -1));

    return Response.json(
      { company: sub.name, cik, ticker: sub.tickers?.[0] || '', trades },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' } }
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
