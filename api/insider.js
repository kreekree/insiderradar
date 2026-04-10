// api/insider.js — Fetch Form 4 insider trades for a given issuer CIK

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

// Step 1: EDGAR company search Atom feed — finds Form 4s WHERE this company is the ISSUER
async function getForm4Filings(cikPadded) {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikPadded}&type=4&dateb=&owner=include&count=20&search_text=&output=atom`;
  console.log('[insider] Fetching:', url);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`EDGAR Atom: ${res.status}`);
  const atom = await res.text();

  // Log enough of the raw feed to diagnose structure
  console.log('[insider] Atom length:', atom.length);
  console.log('[insider] Atom[0-600]:', atom.substring(0, 600));

  const filings = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;

  while ((m = entryRe.exec(atom)) !== null && filings.length < 15) {
    const entry = m[1];
    console.log('[insider] entry[0-400]:', entry.substring(0, 400));

    // Try to find an Archives filing URL (contains /Archives/edgar/data/{cik}/{accNo}/)
    const archivesRe = /https?:\/\/[^"'\s]*\/Archives\/edgar\/data\/(\d+)\/(\d{18})\/([^"'\s<>]*)/i;
    const archivesMatch = entry.match(archivesRe);

    // Extract accession number in dash format: XXXXXXXXXX-YY-ZZZZZZ
    const accRe = /(\d{10}-\d{2}-\d{6})/;
    const accMatch = entry.match(accRe);

    // Extract date
    const dateMatch = entry.match(/<filing-date>([^<]+)<\/filing-date>/i)
                   || entry.match(/<updated>(\d{4}-\d{2}-\d{2})/i);
    const date = dateMatch ? dateMatch[1].trim() : '';

    if (archivesMatch) {
      const filerCik = archivesMatch[1];
      const accNoDashes = archivesMatch[2];
      const accNo = `${accNoDashes.slice(0,10)}-${accNoDashes.slice(10,12)}-${accNoDashes.slice(12)}`;
      console.log('[insider] found via archives URL:', filerCik, accNo, date);
      filings.push({ filerCik, accNoDashes, accNo, date });
    } else if (accMatch) {
      // Build from accession number: first 10 digits = filer CIK
      const accNo = accMatch[1];
      const accNoDashes = accNo.replace(/-/g, '');
      const filerCik = accNoDashes.slice(0, 10).replace(/^0+/, '') || accNoDashes.slice(0, 10);
      console.log('[insider] found via accNo fallback:', filerCik, accNo, date);
      filings.push({ filerCik, accNoDashes, accNo, date });
    } else {
      console.log('[insider] no match in entry');
    }
  }

  console.log('[insider] Total filings:', filings.length);
  return filings;
}

// Step 2: Get the XML file URL from the filing index
async function getXmlUrlFromIndex(filing) {
  const jsonUrl = `https://www.sec.gov/Archives/edgar/data/${filing.filerCik}/${filing.accNoDashes}/${filing.accNo}-index.json`;
  console.log('[insider] index.json:', jsonUrl);
  try {
    const res = await fetch(jsonUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.log('[insider] index.json status:', res.status);
      return null;
    }
    const idx = await res.json();
    const items = idx.directory?.item || [];
    const xmlFile = items.find(f =>
      f.name.endsWith('.xml') &&
      !f.name.toLowerCase().includes('index') &&
      !f.name.match(/^R\d/)
    );
    if (!xmlFile) return null;
    return `https://www.sec.gov/Archives/edgar/data/${filing.filerCik}/${filing.accNoDashes}/${xmlFile.name}`;
  } catch (e) {
    console.log('[insider] index.json error:', e.message);
    return null;
  }
}

// Step 3: Parse Form 4 XML for transactions
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
    console.log('[insider]', ownerName, blocks.length, 'blocks');

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
      transactions.push({ ownerName, title: officerTitle, ticker: issuerTicker, date,
        code, label: TX_CODE[code] || code, shares, price,
        value: Math.round(shares * price), sharesAfter, security, acqDisp });
    }
    return transactions;
  } catch (e) {
    console.log('[insider] parseXml error:', e.message);
    return [];
  }
}

export default async function handler(req, res) {
  const cik = (req.query.cik || '').replace(/^0+/, '');
  if (!cik || !/^\d+$/.test(cik)) {
    return res.status(400).json({ error: 'cik required (numeric)' });
  }
  const cikPadded = cik.padStart(10, '0');
  console.log('[insider] CIK:', cikPadded);

  try {
    const [subRes, filings] = await Promise.all([
      fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, { headers: { 'User-Agent': UA } }),
      getForm4Filings(cikPadded)
    ]);
    if (!subRes.ok) throw new Error('submissions fetch failed');
    const sub = await subRes.json();

    const results = await Promise.all(
      filings.map(async f => {
        try {
          const xmlUrl = await getXmlUrlFromIndex(f);
          if (!xmlUrl) return [];
          return await parseForm4Xml(xmlUrl, f.date);
        } catch { return []; }
      })
    );

    const trades = results.flat().sort((a, b) => (b.date > a.date ? 1 : -1));
    console.log('[insider] trades:', trades.length);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({ company: sub.name, cik, ticker: sub.tickers?.[0] || '', trades });
  } catch (err) {
    console.error('[insider] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
