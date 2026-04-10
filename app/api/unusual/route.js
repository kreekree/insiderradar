import { UA, xmlVal, xmlBlocks } from '@/lib/sec';

const MIN_VALUE = 500000;
const SAMPLE_SIZE = 30;

async function fetchRecentForm4s() {
  const today = new Date().toISOString().split('T')[0];
  const daysAgo30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
  const url = `https://efts.sec.gov/LATEST/search-index?forms=4&dateRange=custom&startdt=${daysAgo30}&enddt=${today}&_source=period_of_report,entity_name,file_date,accession_no&from=0&size=${SAMPLE_SIZE}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('EFTS search failed');
  const data = await res.json();
  return (data.hits?.hits || []).map(h => ({
    entityName: h._source?.entity_name || '',
    fileDate: h._source?.file_date || '',
    accessionRaw: h._source?.accession_no || ''
  }));
}

async function parseAccessionXML(accessionRaw) {
  if (!accessionRaw) return [];
  const accNoDashes = accessionRaw.replace(/-/g, '');
  const filerCik = accessionRaw.split('-')[0].replace(/^0+/, '');

  try {
    const idxRes = await fetch(
      `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${accessionRaw}-index.htm`,
      { headers: { 'User-Agent': UA } }
    );
    if (!idxRes.ok) return [];
    const html = await idxRes.text();

    const xmlMatch = html.match(/href="[^"]+\/([^"]+\.xml)"/i);
    if (!xmlMatch) return [];

    const xmlRes = await fetch(
      `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${xmlMatch[1]}`,
      { headers: { 'User-Agent': UA } }
    );
    if (!xmlRes.ok) return [];
    const xml = await xmlRes.text();

    const ownerName = xmlVal(xml, 'rptOwnerName') || 'Unknown';
    const isOfficer = xml.includes('<isOfficer>1</isOfficer>');
    const isDirector = xml.includes('<isDirector>1</isDirector>');
    const title = isOfficer ? (xmlVal(xml, 'officerTitle') || 'Officer') : isDirector ? 'Director' : 'Other';
    const issuer = xmlVal(xml, 'issuerName') || '';
    const ticker = xmlVal(xml, 'issuerTradingSymbol') || '';

    const buys = [];
    for (const block of xmlBlocks(xml, 'nonDerivativeTransaction')) {
      const code = xmlVal(block, 'transactionCode') || '';
      if (code !== 'P') continue;
      const shares = parseFloat(xmlVal(block, 'transactionShares') || '0');
      const price = parseFloat(xmlVal(block, 'transactionPricePerShare') || '0');
      const value = shares * price;
      if (value < MIN_VALUE) continue;
      buys.push({
        ownerName, title, issuer, ticker,
        date: xmlVal(block, 'transactionDate') || '',
        shares, price, value: Math.round(value)
      });
    }
    return buys;
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const filings = await fetchRecentForm4s();
    const BATCH = 8;
    const allBuys = [];
    for (let i = 0; i < filings.length; i += BATCH) {
      const batch = filings.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(f => parseAccessionXML(f.accessionRaw).catch(() => [])));
      allBuys.push(...results.flat());
    }
    const sorted = allBuys.sort((a, b) => b.value - a.value);
    return Response.json(
      { count: sorted.length, trades: sorted },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' } }
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
