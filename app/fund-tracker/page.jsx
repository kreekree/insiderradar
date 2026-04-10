'use client';
import { useState } from 'react';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { BlurFade } from '@/components/magicui/blur-fade';

function fmtMoney(n) {
  if (!n) return '$—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + Number(n).toLocaleString();
}

export default function FundTrackerPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function doSearch() {
    const name = query.trim();
    if (!name || name.length < 2) { setError('Enter at least 2 characters.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const r = await fetch(`/api/fund?name=${encodeURIComponent(name)}`);
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Fund not found.'); return; }
      setResult(data);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  const maxVal = result ? Math.max(...(result.holdings || []).map(h => h.value), 1) : 1;

  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-400 text-xs px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            13F filings — updated quarterly
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Hedge Fund Holdings Tracker</h1>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Every hedge fund managing over $100M must disclose their stock positions every quarter. Search any fund to see exactly where the smart money is sitting.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Berkshire, Renaissance, Citadel…"
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <ShimmerButton onClick={doSearch} disabled={loading} background="rgba(59,130,246,1)">
              {loading ? '…' : 'Search'}
            </ShimmerButton>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </header>

      {loading && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4"><div className="scan-track" style={{ '--scan-color': '#3b82f6' }}><div className="scan-bar" style={{ background: 'linear-gradient(90deg,transparent,#3b82f6,transparent)' }} /></div></div>
          <p className="text-slate-400 text-sm">Fetching 13F filing from SEC EDGAR…</p>
        </div>
      )}

      {result && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          <BlurFade delay={0.1} inView>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{result.fund}</h2>
                  <p className="text-slate-400 text-sm">Period: <span className="font-mono">{result.period}</span> · Filed: <span className="font-mono">{result.fileDate}</span></p>
                </div>
                <div className="text-slate-400 text-sm font-mono">{result.holdingCount} positions</div>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Security</th>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-right">Value</th>
                      <th className="px-4 py-3 text-right">Shares</th>
                      <th className="px-4 py-3 text-left">Allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(result.holdings || []).map((h, i) => {
                      const pct = Math.round((h.value / maxVal) * 100);
                      return (
                        <tr key={i} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-3 text-white font-medium text-xs">{h.nameOfIssuer}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{h.titleOfClass}</td>
                          <td className="px-4 py-3 text-right text-blue-400 font-mono font-semibold text-xs">{fmtMoney(h.value)}</td>
                          <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">{Number(h.shares).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="w-24 bg-slate-800 rounded h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </BlurFade>
        </main>
      )}

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-white mb-3">What Is a 13F Filing?</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          Any institutional investment manager with over $100 million in assets under management must file a Form 13F with the SEC within 45 days of each quarter end. This lists every equity position they hold — the exact number of shares and the market value at quarter end.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          Funds like Berkshire Hathaway, Renaissance Technologies, and Citadel file 13Fs every quarter. Following their moves gives retail investors insight into where institutional money is flowing — before it becomes mainstream news.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Track Insider Trades →</a>
          <a href="/unusual-activity" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">See Unusual Buying →</a>
        </div>
      </section>
    </>
  );
}
