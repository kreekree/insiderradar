// api/insider.js — Fetch Form 4 insider trades for a given issuer CIK
//
// The key insight: Form 4 filings are filed BY the insider (under their own CIK),
// not by the company. So the company's submissions JSON has no Form 4s.
// Instead we use the EDGAR company search with owner=include&output=atom
// which returns filings where the company appears as the ISSUER.

const UA = 'InsiderRadar contact@insiderradar.com';

const TX_CODE = {
  P: 'BUY', S: 'SELL', A: 'AWARD', D: 'DISPOSE',
  F: 'TAX_WITHHOLD', M: 'OPTION_EXERCISE', G: 'GIFT', I: 'INHERIT'
};

// Extract first match — handles both <tag><value>X</value></tag> and <tag>X</tag>
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

// Step 1: Get recent Form 4 filings for a company as ISSUER via EDGAR Atom feed
async function getForm4Filings(cikPadded) {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikPadded}&type=4&dateb=&owner=include&count=20&search_text=&output=atom`;
  console.log('[insider] Fetching Atom feed:', url);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`EDGAR search failed: ${res.status}`);
  const atom = await res.text();
  console.log('[insider] Atom feed length:', atom.length);
  console.log('[insider] Atom feed preview:', atom.substring(0, 500));

  const filings = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = entryRe.exec(atom)) !== null && filings.length < 15) {
    const entry = m[1];

    // Primary: look for <link ... href="...index.htm...">
    const linkMatch = entry.match(/href="(https?:\/\/[^"]+\/Archives\/edgar\/data\/[^"]+)"/i);
    // Fallback: any href ending in index.htm or index.html
    const hrefFallback = entry.match(/href="([^"]+(?:index\.htm(?:l)?))"/i);
    // Extract accession number from the entry
    const accMatch = entry.match(/<accession-numberNumber>([^<]+)<\/accession-numberNumber>/)
                  || entry.match(/accession-number[^>]*>([0-9-]+)</i);
    const dateMatch = entry.match(/<filing-date>([^<]+)<\/filing-date>/);
    // Extract the filer CIK from title like "4 - Name (0001234567) (Reporting)"
    const titleMatch = entry.match(/<title[^>]*>.*?\((\d{7,10})\).*?Reporting/i);

    const href = linkMatch?.[1] || hrefFallback?.[1] || null;
    console.log('[insider] Entry href:', href, '| accMatch:', accMatch?.[1], '| date:', dateMatch?.[1]);

    if (href) {
      const cikInPath = href.match(/edgar\/data\/(\d+)\//);
      const accFromPath = href.match(/data\/\d+\/(\d{18})\//);

      filings.push({
        href,
        filerCik: cikInPath ? cikInPath[1] : (titleMatch ? titleMatch[1] : null),
        accNoDashes: accFromPath ? accFromPath[1] : (accMatch ? accMatch[1].replace(/-/g, '') : null),
        date: dateMatch ? dateMatch[1].trim() : ''
      });
    } else if (accMatch) {
      // Build URL from accession number if we have it
      // We need filer CIK — extract from title tag
      const filerCik = titleMatch ? titleMatch[1].replace(/^0+/, '') : null;
      const accNo = accMatch[1].replace(/-/g, '');
      if (filerCik && accNo.length === 18) {
        const builtHref = `https://www.sec.gov/Archives/edgar/data/${filerCik}/${accNo}/${accMatch[1]}-index.htm`;
        console.log('[insider] Built href from accNo:', builtHref);
        filings.push({
          href: builtHref,
          filerCik,
          accNoDashes: accNo,
          date: dateMatch ? dateMatch[1].trim() : ''
        });
      }
    }
  }
  console.log('[insider] Total filings found:', filings.length);
  return filings;
}

// Step 2: From filing index URL, find the XML document URL
async function getXmlUrlFromIndex(indexHref) {
  // Convert index.htm URL to index.json
  const jsonUrl = indexHref
    .replace(/-index\.html$/, '-index.json')
    .replace(/-index\.htm$/, '-index.json')
    .replace(/\/index\.html$/, '/index.json')
    .replace(/\/index\.htm$/, '/index.json');

  console.log('[insider] Fetching index JSON:', jsonUrl);
  try {
    const res = await fetch(jsonUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.log('[insider] index.json fetch failed:', res.status, jsonUrl);
      return null;
    }
    const idx = await res.json();
    const items = idx.directory?.item || [];
    console.log('[insider] index.json items:', items.map(i => i.name));
    // Find the Form 4 XML — not the index file, not XBRL viewer files
    const xmlFile = items.find(f =>
      f.name.endsWith('.xml') &&
      !f.name.toLowerCase().includes('index') &&
      !f.name.match(/^R\d/)
    );
    if (!xmlFile) {
      console.log('[insider] No XML file found in:', jsonUrl);
      return null;
    }

    // Build full URL from the base of the indexHref
    const base = indexHref.replace(/[^/]+$/, '');
    const xmlUrl = base + xmlFile.name;
    console.log('[insider] Found XML:', xmlUrl);
    return xmlUrl;
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
    console.log('[insider] XML length:', xml.length, 'for', xmlUrl);

    const ownerName    = xmlVal(xml, 'rptOwnerName') || 'Unknown';
    const isOfficer    = xml.includes('<isOfficer>1</isOfficer>');
    const isDirector   = xml.includes('<isDirector>1</isDirector>');
    const officerTitle = isOfficer
      ? (xmlVal(xml, 'officerTitle') || 'Officer')
      : isDirector ? 'Director' : 'Other';
    const issuerTicker = xmlVal(xml, 'issuerTradingSymbol') || '';
    const period       = xmlVal(xml, 'periodOfReport') || filingDate;

    const blocks = xmlBlocks(xml, 'nonDerivativeTransaction');
    console.log('[insider] nonDerivativeTransaction blocks:', blocks.length, 'for', ownerName);

    const transactions = [];
    for (const block of blocks) {
      const code   = xmlVal(block, 'transactionCode') || '';
      const shares = parseFloat(xmlVal(block, 'transactionShares') || '0');
      const price  = parseFloat(xmlVal(block, 'transactionPricePerShare') || '0');
      const date   = xmlVal(block, 'transactionDate') || period;
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
    console.log('[insider] Transactions from this filing:', transactions.length);
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
  console.log('[insider] handler called for CIK:', cikPadded);

  try {
    // Get company name from submissions API
    const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cikPadded}.json`, {
      headers: { 'User-Agent': UA }
    });
    if (!subRes.ok) throw new Error('SEC submissions fetch failed');
    const sub = await subRes.json();

    // Get Form 4 filing list via EDGAR company search (owner=include finds issuer filings)
    const filings = await getForm4Filings(cikPadded);
    console.log('[insider] Processing', filings.length, 'filings for', sub.name);

    // For each filing: get XML URL then parse trades
    const results = await Promise.all(
      filings.map(async f => {
        try {
          const xmlUrl = await getXmlUrlFromIndex(f.href);
          if (!xmlUrl) return [];
          return await parseForm4Xml(xmlUrl, f.date);
        } catch (e) {
          console.log('[insider] Filing error:', e.message);
          return [];
        }
      })
    );

    const trades = results.flat().sort((a, b) => (b.date > a.date ? 1 : -1));
    console.log('[insider] Total trades returned:', trades.length);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.json({
      company: sub.name,
      cik,
      ticker: sub.tickers?.[0] || '',
      trades
    });
  } catch (err) {
    console.error('[insider] handler error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch insider trades' });
  }
}
