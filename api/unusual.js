// api/unusual.js — Surface recent Form 4 insider buys flagged as "unusual"
// Strategy: fetch recent Form 4s from EDGAR full-text search, parse XML,
// flag trades where value > $500K (open-market purchases only, code P)

const UA = 'InsiderRadar contact@insiderradar.com';
const MIN_VALUE = 500000; // $500K threshold for "unusual"
const SAMPLE_SIZE = 30;   // How many recent Form 4s to scan

function xmlVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>\\s*<value>([^<]+)<\\/value>`, 'i'));
  return m ? m[1].trim() : null;
}

function xmlBlocks(xml, tag) {
  const blocks = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);
  return blocks;
}

async function fetchRecentForm4s() {
  // EDGAR EFTS full-text search — returns recent Form 4 filing metadata
  const today = new Date().toISOString().split('T')[0];
  const daysAgo30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const url = `https://efts.sec.gov/LATEST/search-index?forms=4&dateRange=custom&startdt=${daysAgo30}&enddt=${today}&hits.hits.total.value=true&hits.hits._source.period_of_report&hits.hits._source.entity_name&hits.hits._source.file_date&_source=period_of_report,entity_name,file_date,file_num,accession_no&from=0&size=${SAMPLE_SIZE}`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('EFTS search failed');
  const data = await res.json();
  return (data.hits?.hits || []).map(h => ({
    entityName: h._source?.entity_name || '',
    fileDate: h._source?.file_date || '',
    accession: (h._source?.accession_no || '').replace(/-/g, ''),
    accessionRaw: h._source?.accession_no || '',
    cik: h._source?.file_num || h._id?.split(':')[0] || ''
  }));
}

async function parseFilingForBuys(filing) {
  // Try to find the XML primary document from the filing index
  const { accession, accessionRaw } = filing;

  // Get the filing index to find the .xml document
  // The accession number doesn't directly give us the CIK for the URL path
  // Use the EDGAR filing index endpoint
  const indexUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&filenum=${filing.cik}&type=4&dateb=&owner=include&count=1&search_text=`;

  // Simpler: fetch the filing directly using EDGAR full submission index
  // Filing docs are at: /Archives/edgar/data/{cik}/{accNoDashes}/
  // We need the index JSON: /cgi-bin/browse-edgar?action=getcompany&...
  // Best approach: use the submissions endpoint via the entity name search
  const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(accessionRaw)}%22&dateRange=custom&startdt=${filing.fileDate}&enddt=${filing.fileDate}`;

  try {
    const idxRes = await fetch(
      `https://www.sec.gov/Archives/edgar/full-index/` +
      // fallback: just try known pattern with accession
      `${filing.fileDate.slice(0, 4)}/${qtrFromDate(filing.fileDate)}/company.idx`,
      { headers: { 'User-Agent': UA } }
    );
    // This approach is too indirect. Use the EDGAR submissions API differently.
    return null;
  } catch {
    return null;
  }
}

function qtrFromDate(dateStr) {
  const m = parseInt(dateStr.split('-')[1]);
  return `QTR${Math.ceil(m / 3)}`;
}

// Alternative: directly use the accession number pattern to build CIK-less URL
// and rely on the EDGAR redirect
async function parseAccessionXML(accessionRaw) {
  if (!accessionRaw) return [];
  const accNoDashes = accessionRaw.replace(/-/g, '');
  // The filer CIK is the first 10 digits of the accession number
  const filerCik = accessionRaw.split('-')[0].replace(/^0+/, '');

  const idxUrl = `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${accessionRaw}-index.htm`;

  try {
    const idxRes = await fetch(idxUrl, { headers: { 'User-Agent': UA } });
    if (!idxRes.ok) return [];
    const html = await idxRes.text();

    // Find the .xml document link (Form 4 XML)
    const xmlMatch = html.match(/href="[^"]+\/([^"]+\.xml)"/i);
    if (!xmlMatch) return [];
    const xmlDoc = xmlMatch[1];

    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNoDashes}/${xmlDoc}`;
    const xmlRes = await fetch(xmlUrl, { headers: { 'User-Agent': UA } });
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
      if (code !== 'P') continue; // Only open-market purchases
      const shares = parseFloat(xmlVal(block, 'transactionShares') || '0');
      const price = parseFloat(xmlVal(block, 'transactionPricePerShare') || '0');
      const value = shares * price;
      if (value < MIN_VALUE) continue;
      const date = xmlVal(block, 'transactionDate') || '';

      buys.push({ ownerName, title, issuer, ticker, date, shares, price, value: Math.round(value) });
    }
    return buys;
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const filings = await fetchRecentForm4s();

    // Parse in parallel, limit concurrency to avoid rate-limiting
    const BATCH = 8;
    const allBuys = [];
    for (let i = 0; i < filings.length; i += BATCH) {
      const batch = filings.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(f => parseAccessionXML(f.accessionRaw).catch(() => [])));
      allBuys.push(...results.flat());
    }

    // Sort by value descending
    const sorted = allBuys.sort((a, b) => b.value - a.value);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({ count: sorted.length, trades: sorted });
  } catch (err) {
    console.error('unusual error:', err);
    return res.status(500).json({ error: 'Failed to fetch unusual activity' });
  }
}
