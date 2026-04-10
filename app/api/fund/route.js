import { UA, xmlVal, xmlBlocks } from '@/lib/sec';

async function searchFund(name) {
  const url = `https://efts.sec.gov/LATEST/search-index?forms=13F-HR&entity=${encodeURIComponent(name)}&_source=entity_name,file_date,accession_no,period_of_report&from=0&size=5`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('EFTS 13F search failed');
  const data = await res.json();
  return (data.hits?.hits || []).map(h => ({
    entityName: h._source?.entity_name || '',
    fileDate: h._source?.file_date || '',
    period: h._source?.period_of_report || '',
    accessionRaw: h._source?.accession_no || ''
  }));
}

async function parseInfoTable(accessionRaw) {
  const accNoDashes = accessionRaw.replace(/-/g, '');
  const filerCik = accessionRaw.split('-')[0].replace(/^0+/, '');

  const idxRes = await fetch(
    `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${accessionRaw}-index.htm`,
    { headers: { 'User-Agent': UA } }
  );
  if (!idxRes.ok) throw new Error('Filing index not found');
  const html = await idxRes.text();

  const infoMatch = html.match(/href="([^"]+infotable[^"]*\.xml)"/i) || html.match(/href="([^"]+\.xml)"/i);
  if (!infoMatch) throw new Error('InfoTable XML not found');

  const xmlPath = infoMatch[1].startsWith('http') ? infoMatch[1] : `https://www.sec.gov${infoMatch[1]}`;
  const xmlRes = await fetch(xmlPath, { headers: { 'User-Agent': UA } });
  if (!xmlRes.ok) throw new Error('InfoTable XML fetch failed');
  const xml = await xmlRes.text();

  const holdings = [];
  for (const block of xmlBlocks(xml, 'infoTable')) {
    const nameOfIssuer = xmlVal(block, 'nameOfIssuer') || xmlVal(block, 'issuerName') || '';
    const value = parseFloat(xmlVal(block, 'value') || '0') * 1000;
    const shares = parseFloat(xmlVal(block, 'sshPrnamtAmt') || xmlVal(block, 'shrsOrPrnAmt') || '0');
    if (!nameOfIssuer) continue;
    holdings.push({
      nameOfIssuer,
      titleOfClass: xmlVal(block, 'titleOfClass') || '',
      cusip: xmlVal(block, 'cusip') || '',
      value, shares,
      investmentDiscretion: xmlVal(block, 'investmentDiscretion') || '',
      putCall: xmlVal(block, 'putCall') || ''
    });
  }
  return holdings.sort((a, b) => b.value - a.value).slice(0, 50);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') || '').trim();

  if (!name || name.length < 2) return Response.json({ error: 'name required (min 2 chars)' }, { status: 400 });

  try {
    const results = await searchFund(name);
    if (!results.length) return Response.json({ error: `No 13F filer found matching "${name}"` }, { status: 404 });

    const latest = results[0];
    let holdings = [];
    let warning;
    try { holdings = await parseInfoTable(latest.accessionRaw); }
    catch (e) { warning = e.message; }

    return Response.json(
      { fund: latest.entityName, period: latest.period, fileDate: latest.fileDate, holdingCount: holdings.length, holdings, ...(warning ? { warning } : {}) },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' } }
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
