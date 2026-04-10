'use client';
import { useState, useRef } from 'react';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { BorderBeam } from '@/components/magicui/border-beam';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { BlurFade } from '@/components/magicui/blur-fade';

const TX_LABELS = { BUY: 'BUY', SELL: 'SELL', AWARD: 'AWARD', DISPOSE: 'DISPOSE', TAX_WITHHOLD: 'TAX', OPTION_EXERCISE: 'EXERCISE', GIFT: 'GIFT', INHERIT: 'INHERIT' };

function fmtNum(n) { return Number(n).toLocaleString(); }
function fmtMoney(n) {
  if (!n) return '$—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + fmtNum(n);
}
function fmtPrice(p) { return p ? '$' + Number(p).toFixed(2) : '$—'; }
function isUnusual(t) { return t.label === 'BUY' && t.value >= 500000; }

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const inputRef = useRef(null);

  async function doSearch() {
    const ticker = query.toUpperCase().trim().replace(/[^A-Z]/g, '');
    if (!ticker) { setError('Enter a ticker symbol.'); return; }
    setError('');
    setLoading(true);
    setCompany(null);
    setTrades([]);
    setFilter('ALL');

    try {
      const r1 = await fetch(`/api/ticker?ticker=${ticker}`);
      const co = await r1.json();
      if (!r1.ok) { setError(co.error || 'Ticker not found.'); return; }

      const r2 = await fetch(`/api/insider?cik=${co.cik}`);
      const data = await r2.json();
      if (!r2.ok) { setError(data.error || 'Failed to load trades.'); return; }

      setCompany({ ...co, name: data.company });
      setTrades(data.trades || []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getFiltered() {
    let rows = [...trades];
    if (filter === 'BUY') rows = rows.filter(t => t.label === 'BUY');
    if (filter === 'SELL') rows = rows.filter(t => t.label === 'SELL');
    if (filter === 'UNUSUAL') rows = rows.filter(isUnusual);
    rows.sort((a, b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return rows;
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const rows = getFiltered();
  const buys = trades.filter(t => t.label === 'BUY');
  const sells = trades.filter(t => t.label === 'SELL');
  const netVal = buys.reduce((s, t) => s + t.value, 0) - sells.reduce((s, t) => s + t.value, 0);
  const hasUnusual = trades.some(isUnusual);

  // Chart data
  const months = {};
  trades.forEach(t => {
    const mo = (t.date || '').slice(0, 7);
    if (!mo) return;
    if (!months[mo]) months[mo] = { buy: 0, sell: 0 };
    if (t.label === 'BUY') months[mo].buy += t.value || 0;
    if (t.label === 'SELL') months[mo].sell += t.value || 0;
  });
  const chartEntries = Object.entries(months).sort((a, b) => a[0] > b[0] ? 1 : -1).slice(-6);
  const maxVal = Math.max(...chartEntries.flatMap(([, v]) => [v.buy, v.sell]), 1);

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden py-16 px-4" style={{ backgroundColor: '#080d18' }}>
        <DotPattern cx={1} cy={1} cr={1} className="fill-slate-700/40" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs px-3 py-1 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live from SEC EDGAR — Updated within 48 hours of every trade
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            The Insiders Always Knew.<br className="hidden sm:block" /> Now You Do Too.
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Every CEO buy. Every flagged cluster. Every Form 4 they had to file within 48 hours. Public government data. All free. You just needed someone to surface it.
          </p>

          <div className="flex gap-3 max-w-md mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="AAPL, TSLA, NVDA…"
              maxLength={5}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm uppercase"
            />
            <ShimmerButton onClick={doSearch} disabled={loading}>
              {loading ? '…' : 'Search'}
            </ShimmerButton>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </header>

      {/* Ezoic */}
      <div id="ezoic-pub-ad-placeholder-101" />

      {/* Company card */}
      {company && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 overflow-hidden">
            <BorderBeam size={250} duration={12} />
            <div>
              <span className="text-2xl font-extrabold text-white font-mono">{company.ticker}</span>
              <span className="text-slate-400 ml-2 text-sm">{company.name}</span>
            </div>
            <div className="ml-auto flex gap-6 text-sm">
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-xl font-mono">
                  <NumberTicker value={buys.length} />
                </div>
                <div className="text-slate-500 text-xs">Buys (90d)</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold text-xl font-mono">
                  <NumberTicker value={sells.length} />
                </div>
                <div className="text-slate-500 text-xs">Sells (90d)</div>
              </div>
              <div className="text-center">
                <div className={`font-bold text-xl font-mono ${netVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtMoney(Math.abs(netVal))}
                </div>
                <div className="text-slate-500 text-xs">Net Value</div>
              </div>
              {hasUnusual && (
                <div className="text-center flex items-center">
                  <span className="badge-unusual text-sm px-3 py-1">&#9888; UNUSUAL</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div id="ezoic-pub-ad-placeholder-102" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="scan-track"><div className="scan-bar" /></div>
          </div>
          <p className="text-slate-400 text-sm">Pulling Form 4 filings from SEC EDGAR…</p>
          <p className="text-slate-600 text-xs mt-1 font-mono">parsing xml · verifying transactions · sorting by date</p>
        </div>
      )}

      {/* Data */}
      {!loading && trades.length > 0 && (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Chart */}
          <BlurFade delay={0.1} inView>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Buy / Sell Activity</h2>
              <div className="space-y-2">
                {chartEntries.map(([mo, v]) => {
                  const buyPct = Math.round((v.buy / maxVal) * 100);
                  const sellPct = Math.round((v.sell / maxVal) * 100);
                  return (
                    <div key={mo} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 w-14 shrink-0 font-mono">{mo.slice(2)}</span>
                      <div className="flex-1 flex flex-col gap-1">
                        {buyPct > 0 && <div className="h-2 rounded bg-emerald-500 transition-all duration-700" style={{ width: `${buyPct}%` }} title={`Buys: ${fmtMoney(v.buy)}`} />}
                        {sellPct > 0 && <div className="h-2 rounded bg-red-500 transition-all duration-700" style={{ width: `${sellPct}%` }} title={`Sells: ${fmtMoney(v.sell)}`} />}
                      </div>
                      <span className="text-slate-500 w-20 text-right font-mono">{fmtMoney(v.buy || v.sell)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Buy</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Sell</span>
              </div>
            </div>
          </BlurFade>

          {/* Table */}
          <BlurFade delay={0.2} inView>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h2 className="font-semibold text-white text-sm">Recent Insider Transactions</h2>
                <span className="text-xs text-slate-500">{rows.length} transaction{rows.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Filters */}
              <div className="px-4 py-2 border-b border-slate-800 flex gap-2 flex-wrap">
                {['ALL', 'BUY', 'SELL', 'UNUSUAL'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-3 py-1 rounded-full transition ${filter === f ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {f === 'UNUSUAL' ? '⚠ Unusual' : f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase() + 's Only'}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      {[['date', 'Date'], ['', 'Insider'], ['', 'Title'], ['', 'Type'], ['shares', 'Shares'], ['price', 'Price'], ['value', 'Value']].map(([col, label]) => (
                        <th
                          key={label}
                          onClick={col ? () => handleSort(col) : undefined}
                          className={`px-4 py-3 text-left ${col ? 'sortable cursor-pointer' : ''} ${['Shares', 'Price', 'Value'].includes(label) ? 'text-right' : ''} ${label === 'Type' ? 'text-center' : ''} ${sortCol === col ? (sortDir === 'asc' ? 'asc' : 'desc') : ''}`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {rows.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">Nothing matches that filter — try All to see the full picture.</td></tr>
                    ) : rows.map((t, i) => {
                      const isBuy = t.label === 'BUY';
                      const isSell = t.label === 'SELL';
                      const rowCls = isBuy ? 'row-buy' : isSell ? 'row-sell' : 'row-other';
                      const valCls = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-slate-300';
                      return (
                        <tr key={i} className={`${rowCls} hover:bg-slate-800/40 transition`} style={{ animationDelay: `${i * 20}ms` }}>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{t.date}</td>
                          <td className="px-4 py-3 text-white font-medium text-xs">{t.ownerName}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{t.title}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={isBuy ? 'badge-buy' : isSell ? 'badge-sell' : 'badge-other'}>{t.label}</span>
                            {isUnusual(t) && <span className="ml-1 badge-unusual">⚠</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300 text-xs">{fmtNum(t.shares)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300 text-xs">{fmtPrice(t.price)}</td>
                          <td className={`px-4 py-3 text-right font-mono font-semibold text-xs ${valCls}`}>{fmtMoney(t.value)}</td>
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

      {/* Explainer */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-4">The Information Wall Street Doesn&apos;t Want You to Find</h2>
        <p className="text-slate-400 mb-4 leading-relaxed">
          Every time a CEO, CFO, or board member buys or sells their own company&apos;s stock, they&apos;re legally required to file a disclosure with the SEC within <strong className="text-slate-200">48 hours</strong>. It&apos;s called a <strong className="text-slate-200">Form 4</strong> — and it&apos;s been on a free government database since 1996. Hedge fund compliance desks monitor it daily.
        </p>
        <p className="text-slate-400 mb-4 leading-relaxed">
          When a CEO spends <em>their own money</em> buying stock at market price, that&apos;s conviction. They know the pipeline, the deal flow, the numbers before they&apos;re public. InsiderRadar surfaces it automatically — no $200/month subscription required.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { tag: 'FORM 4', tagColor: 'text-emerald-400 border-emerald-800 bg-emerald-950/50', title: '48 Hours or Bust', body: 'Insiders must report every trade within 2 business days. We parse those filings straight from SEC EDGAR — no middleman, no markup.' },
            { tag: 'FLAGGED', tagColor: 'text-amber-400 border-amber-800 bg-amber-950/50', title: 'Not Just Listed', body: 'Open-market purchases over $500K get flagged as unusual — because a CEO writing a personal check for half a million at market price is not routine.' },
            { tag: '13F', tagColor: 'text-blue-400 border-blue-800 bg-blue-950/50', title: 'Follow the Funds Too', body: 'Hedge funds with $100M+ must disclose every stock position quarterly. Use our 13F tracker to see where the smart money is allocated.' },
          ].map(card => (
            <div key={card.tag} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="mb-3">
                <span className={`font-mono text-xs border px-2 py-1 rounded ${card.tagColor}`}>{card.tag}</span>
              </div>
              <h3 className="font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-slate-400 text-sm">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/unusual-activity" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">⚠ See What&apos;s Flagged Right Now →</a>
          <a href="/fund-tracker" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Follow the Hedge Funds →</a>
          <a href="/how-to-read-form4-13f" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Learn to Read Form 4 →</a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-4">
        <div id="ezoic-pub-ad-placeholder-103" />
      </div>
    </>
  );
}
