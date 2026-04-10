export const revalidate = 3600;

export const metadata = {
  title: 'Unusual Insider Buying Activity — SEC Form 4 Alerts',
  description: 'Real-time unusual insider buying alerts from SEC Form 4 filings. See which executives are making large open-market stock purchases.',
};

function fmtNum(n) { return Number(n).toLocaleString(); }
function fmtMoney(n) {
  if (!n) return '$—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}
function fmtPrice(p) { return p ? '$' + Number(p).toFixed(2) : '$—'; }

async function getData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderradar.vercel.app'}/api/unusual`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return { trades: [] };
    return res.json();
  } catch {
    return { trades: [] };
  }
}

export default async function UnusualActivityPage() {
  const data = await getData();
  const trades = data.trades || [];

  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-950 border border-amber-800 text-amber-400 text-xs px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Scanning now — refreshed every hour
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">⚠ Unusual Insider Buying Activity</h1>
          <p className="text-slate-400 text-base max-w-2xl">
            Open-market purchases over $500,000 — the insider wrote a personal check at market price. When a CEO does that, they&apos;re not guessing. Data is live from{' '}
            <a href="https://www.sec.gov/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">SEC EDGAR</a> Form 4 filings.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-slate-400 text-sm">{trades.length} unusual trade{trades.length !== 1 ? 's' : ''}</span>
            <span className="text-slate-600 text-xs ml-2">— purchases over $500K in the last 30 days</span>
          </div>
          <div className="text-xs text-slate-600">Sorted by value</div>
        </div>

        <div id="ezoic-pub-ad-placeholder-102" className="mb-4" />

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Insider</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {trades.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">No unusual activity found in the last 30 days. Check back soon.</td></tr>
                ) : trades.map((t, i) => (
                  <tr key={i} className="row-buy hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white font-mono text-xs">{t.ticker || t.issuer}</span>
                      <span className="text-slate-500 text-xs block">{t.issuer}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">{t.ownerName}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{t.title}</td>
                    <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">{fmtNum(t.shares)}</td>
                    <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">{fmtPrice(t.price)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono text-xs">{fmtMoney(t.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-white mb-3">Why This Data Actually Moves Markets</h2>
        <p className="text-slate-400 mb-4 leading-relaxed text-sm">
          When a CEO decides to spend half a million dollars of their own money buying their company&apos;s stock at market price — not through options, not through awards — that&apos;s one of the clearest signals in public markets. They didn&apos;t have to do it. They chose to.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          This page only flags transaction code <strong className="text-slate-200">P (open-market purchase)</strong>. Stock awards, option exercises, and tax withholdings are excluded — they carry zero signal. All data pulled live from <a href="https://www.sec.gov/cgi-bin/browse-edgar" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">SEC EDGAR</a>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Search a Specific Ticker →</a>
          <a href="/fund-tracker" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Follow the Hedge Funds Too →</a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-4">
        <div id="ezoic-pub-ad-placeholder-103" />
      </div>
    </>
  );
}
