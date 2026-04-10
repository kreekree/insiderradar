// api/fund.js — Fetch 13F-HR institutional holdings for a hedge fund
// Searches EDGAR for 13F filer by name, parses latest InfoTable XML

const UA = 'InsiderRadar contact@insiderradar.com';

function xmlVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/\\s*${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

function xmlBlocks(xml, tag) {
  const blocks = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);
  return blocks;
}

async function searchFund(name) {
  const url = `https://efts.sec.gov/LATEST/search-index?forms=13F-HR&entity=${encodeURIComponent(name)}&hits.hits._source.entity_name&_source=entity_name,file_date,accession_no,period_of_report&from=0&size=5`;
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

  // Get filing index
  const idxUrl = `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${accessionRaw}-index.htm`;
  const idxRes = await fetch(idxUrl, { headers: { 'User-Agent': UA } });
  if (!idxRes.ok) throw new Error('Filing index not found');
  const html = await idxRes.text();

  // Find the InfoTable XML (holdings data)
  const infoMatch = html.match(/href="([^"]+infotable[^"]*\.xml)"/i)
    || html.match(/href="([^"]+\.xml)"/i);
  if (!infoMatch) throw new Error('InfoTable XML not found in index');

  const xmlPath = infoMatch[1].startsWith('http')
    ? infoMatch[1]
    : `https://www.sec.gov${infoMatch[1]}`;

  const xmlRes = await fetch(xmlPath, { headers: { 'User-Agent': UA } });
  if (!xmlRes.ok) throw new Error('InfoTable XML fetch failed');
  const xml = await xmlRes.text();

  const holdings = [];
  for (const block of xmlBlocks(xml, 'infoTable')) {
    const nameOfIssuer = xmlVal(block, 'nameOfIssuer') || xmlVal(block, 'issuerName') || '';
    const titleOfClass = xmlVal(block, 'titleOfClass') || '';
    const cusip = xmlVal(block, 'cusip') || '';
    const value = parseFloat(xmlVal(block, 'value') || '0') * 1000; // 13F values in thousands
    const sshPrnamtAmt = parseFloat(xmlVal(block, 'sshPrnamtAmt') || xmlVal(block, 'shrsOrPrnAmt') || '0');
    const investmentDiscretion = xmlVal(block, 'investmentDiscretion') || '';
    const putCall = xmlVal(block, 'putCall') || '';

    if (!nameOfIssuer) continue;
    holdings.push({ nameOfIssuer, titleOfClass, cusip, value, shares: sshPrnamtAmt, investmentDiscretion, putCall });
  }

  // Sort by value descending
  return holdings.sort((a, b) => b.value - a.value).slice(0, 50);
}

export default async function handler(req, res) {
  const name = (req.query.name || '').trim();

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'name query parameter required (min 2 chars)' });
  }

  try {
    const results = await searchFund(name);

    if (!results.length) {
      return res.status(404).json({ error: `No 13F filer found matching "${name}"` });
    }

    // Use the most recent filing
    const latest = results[0];

    let holdings = [];
    let parseError = null;
    try {
      holdings = await parseInfoTable(latest.accessionRaw);
    } catch (e) {
      parseError = e.message;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({
      fund: latest.entityName,
      period: latest.period,
      fileDate: latest.fileDate,
      holdingCount: holdings.length,
      holdings,
      ...(parseError ? { warning: parseError } : {})
    });
  } catch (err) {
    console.error('fund error:', err);
    return res.status(500).json({ error: 'Failed to fetch fund holdings' });
  }
}
