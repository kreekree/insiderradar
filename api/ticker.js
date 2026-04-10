// api/ticker.js — Resolve ticker symbol to SEC CIK number
// Caches the company_tickers.json in memory for 24 hours to avoid hammering SEC

let tickerCache = null;
let cacheExpiry = 0;

async function getTickerMap() {
  if (tickerCache && Date.now() < cacheExpiry) return tickerCache;

  const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': 'InsiderRadar contact@insiderradar.com' }
  });
  if (!res.ok) throw new Error('Failed to fetch ticker list from SEC');

  const data = await res.json();
  // Transform from { "0": {cik_str, ticker, title}, ... } to { "AAPL": {...}, ... }
  tickerCache = {};
  for (const entry of Object.values(data)) {
    tickerCache[entry.ticker.toUpperCase()] = entry;
  }
  cacheExpiry = Date.now() + 24 * 60 * 60 * 1000;
  return tickerCache;
}

export default async function handler(req, res) {
  const ticker = (req.query.ticker || '').toUpperCase().trim();

  if (!ticker) {
    return res.status(400).json({ error: 'ticker query parameter required' });
  }
  if (!/^[A-Z]{1,5}$/.test(ticker)) {
    return res.status(400).json({ error: 'Invalid ticker format' });
  }

  try {
    const map = await getTickerMap();
    const entry = map[ticker];

    if (!entry) {
      return res.status(404).json({ error: `Ticker ${ticker} not found in SEC database` });
    }

    const cik = entry.cik_str;
    const cikPadded = String(cik).padStart(10, '0');

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    return res.json({
      ticker,
      cik,
      cikPadded,
      company: entry.title
    });
  } catch (err) {
    console.error('ticker error:', err);
    return res.status(500).json({ error: 'Failed to look up ticker' });
  }
}
