import { UA } from '@/lib/sec';

let tickerCache = null;
let cacheExpiry = 0;

async function getTickerMap() {
  if (tickerCache && Date.now() < cacheExpiry) return tickerCache;
  const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': UA }
  });
  if (!res.ok) throw new Error('Failed to fetch ticker list from SEC');
  const data = await res.json();
  tickerCache = {};
  for (const entry of Object.values(data)) {
    tickerCache[entry.ticker.toUpperCase()] = entry;
  }
  cacheExpiry = Date.now() + 24 * 60 * 60 * 1000;
  return tickerCache;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get('ticker') || '').toUpperCase().trim();

  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 });
  if (!/^[A-Z]{1,5}$/.test(ticker)) return Response.json({ error: 'Invalid ticker' }, { status: 400 });

  try {
    const map = await getTickerMap();
    const entry = map[ticker];
    if (!entry) return Response.json({ error: `Ticker ${ticker} not found in SEC database` }, { status: 404 });

    const cik = entry.cik_str;
    return Response.json(
      { ticker, cik, cikPadded: String(cik).padStart(10, '0'), company: entry.title },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' } }
    );
  } catch (err) {
    return Response.json({ error: 'Failed to look up ticker' }, { status: 500 });
  }
}
