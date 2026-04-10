'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { BorderBeam } from '@/components/magicui/border-beam';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { NumberTicker } from '@/components/magicui/number-ticker';

// ─── helpers ─────────────────────────────────────────────────────────────────
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

// ─── motion variants ──────────────────────────────────────────────────────────
const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const heroItem = {
  hidden: { y: 22, opacity: 0, filter: 'blur(8px)' },
  visible: {
    y: 0, opacity: 1, filter: 'blur(0px)',
    transition: { type: 'spring', damping: 22, stiffness: 200 },
  },
};
const cardSpring = {
  hidden: { y: 36, opacity: 0, scale: 0.97 },
  visible: {
    y: 0, opacity: 1, scale: 1,
    transition: { type: 'spring', damping: 24, stiffness: 220 },
  },
};
const sectionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { y: 28, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 22, stiffness: 180 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 280 } },
};

const SCAN_STEPS = [
  'Querying SEC EDGAR full-text search…',
  'Fetching Form 4 XML filings…',
  'Parsing transaction codes…',
  'Sorting by trade date…',
];

// ─── scroll-triggered section ─────────────────────────────────────────────────
function InViewSection({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={sectionStagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [scanStep, setScanStep] = useState(0);
  const inputRef = useRef(null);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) { setScanStep(0); return; }
    const t = setInterval(() => setScanStep(s => (s + 1) % SCAN_STEPS.length), 1300);
    return () => clearInterval(t);
  }, [loading]);

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
      {/* ── Hero ── */}
      <motion.header
        variants={heroStagger}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden py-16 px-4"
        style={{ backgroundColor: '#080d18' }}
      >
        <DotPattern cx={1} cy={1} cr={1} className="fill-slate-700/40" />
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div variants={heroItem} className="mb-5">
            <span className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs px-3 py-1 rounded-full">
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-emerald-400 inline-block"
              />
              Live from SEC EDGAR — Updated within 48 hours of every trade
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={heroItem}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight"
          >
            The Insiders Always Knew.<br className="hidden sm:block" /> Now You Do Too.
          </motion.h1>

          {/* Sub */}
          <motion.p variants={heroItem} className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Every CEO buy. Every flagged cluster. Every Form 4 they had to file within 48 hours.
            Public government data. All free. You just needed someone to surface it.
          </motion.p>

          {/* Search row */}
          <motion.div variants={heroItem} className="flex gap-3 max-w-md mx-auto">
            <motion.input
              ref={inputRef}
              whileFocus={{ scale: 1.02, borderColor: '#10b981' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="AAPL, TSLA, NVDA…"
              maxLength={5}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm uppercase"
            />
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', damping: 16, stiffness: 320 }}
            >
              <ShimmerButton onClick={doSearch} disabled={loading}>
                {loading ? '…' : 'Search'}
              </ShimmerButton>
            </motion.div>
          </motion.div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: -8, x: 0 }}
                animate={{ opacity: 1, y: 0, x: [0, -8, 8, -5, 5, -2, 2, 0] }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.45 }}
                className="text-red-400 text-xs mt-2 font-mono"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <div id="ezoic-pub-ad-placeholder-101" />

      {/* ── Company card ── */}
      <AnimatePresence>
        {company && (
          <motion.div
            key={company.ticker}
            variants={cardSpring}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -16, transition: { duration: 0.18 } }}
            className="max-w-6xl mx-auto px-4 mt-6"
          >
            <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 overflow-hidden">
              <BorderBeam size={250} duration={10} />
              <div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.1 }}
                  className="text-2xl font-extrabold text-white font-mono inline-block"
                >
                  {company.ticker}
                </motion.span>
                <span className="text-slate-400 ml-2 text-sm">{company.name}</span>
              </div>
              <div className="ml-auto flex gap-6 text-sm">
                {[
                  { value: buys.length, color: 'text-emerald-400', label: 'Buys (90d)' },
                  { value: sells.length, color: 'text-red-400', label: 'Sells (90d)' },
                ].map(({ value, color, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 240, delay: 0.15 + i * 0.07 }}
                    className="text-center"
                  >
                    <div className={`${color} font-bold text-xl font-mono`}>
                      <NumberTicker value={value} />
                    </div>
                    <div className="text-slate-500 text-xs">{label}</div>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 240, delay: 0.29 }}
                  className="text-center"
                >
                  <div className={`font-bold text-xl font-mono ${netVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtMoney(Math.abs(netVal))}
                  </div>
                  <div className="text-slate-500 text-xs">Net Value</div>
                </motion.div>
                {hasUnusual && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.38 }}
                    className="text-center flex items-center"
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="badge-unusual text-sm px-3 py-1"
                    >
                      &#9888; UNUSUAL
                    </motion.span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div id="ezoic-pub-ad-placeholder-102" />
      </div>

      {/* ── Loading ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            {/* Scan bar */}
            <div className="flex justify-center mb-6">
              <div className="scan-track" style={{ width: 240 }}>
                <div className="scan-bar" />
              </div>
            </div>

            {/* Cycling status messages */}
            <AnimatePresence mode="wait">
              <motion.p
                key={scanStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="text-slate-400 text-sm font-mono"
              >
                {SCAN_STEPS[scanStep]}
              </motion.p>
            </AnimatePresence>

            {/* Staggered dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Data ── */}
      <AnimatePresence>
        {!loading && trades.length > 0 && (
          <motion.main
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto px-4 py-6 space-y-6"
          >
            {/* ── Chart ── */}
            <motion.div
              variants={cardSpring}
              initial="hidden"
              animate="visible"
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <h2 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                Buy / Sell Activity
              </h2>
              <div className="space-y-3">
                {chartEntries.map(([mo, v], idx) => {
                  const buyPct = Math.round((v.buy / maxVal) * 100);
                  const sellPct = Math.round((v.sell / maxVal) * 100);
                  return (
                    <div key={mo} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 w-14 shrink-0 font-mono">{mo.slice(2)}</span>
                      <div className="flex-1 flex flex-col gap-1">
                        {buyPct > 0 && (
                          <motion.div
                            className="h-2 rounded bg-emerald-500 origin-left"
                            initial={{ width: 0 }}
                            animate={{ width: `${buyPct}%` }}
                            transition={{ type: 'spring', damping: 22, stiffness: 90, delay: idx * 0.06 }}
                            title={`Buys: ${fmtMoney(v.buy)}`}
                          />
                        )}
                        {sellPct > 0 && (
                          <motion.div
                            className="h-2 rounded bg-red-500 origin-left"
                            initial={{ width: 0 }}
                            animate={{ width: `${sellPct}%` }}
                            transition={{ type: 'spring', damping: 22, stiffness: 90, delay: idx * 0.06 + 0.04 }}
                            title={`Sells: ${fmtMoney(v.sell)}`}
                          />
                        )}
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
            </motion.div>

            {/* ── Table ── */}
            <motion.div
              variants={cardSpring}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.08 }}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h2 className="font-semibold text-white text-sm">Recent Insider Transactions</h2>
                <motion.span
                  key={rows.length}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 300 }}
                  className="text-xs text-slate-500 font-mono"
                >
                  {rows.length} transaction{rows.length !== 1 ? 's' : ''}
                </motion.span>
              </div>

              {/* Filter pills — sliding layoutId background */}
              <div className="px-4 py-2 border-b border-slate-800 flex gap-2 flex-wrap">
                {['ALL', 'BUY', 'SELL', 'UNUSUAL'].map(f => {
                  const active = filter === f;
                  return (
                    <motion.button
                      key={f}
                      onClick={() => setFilter(f)}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                      className="relative text-xs px-3 py-1 rounded-full"
                    >
                      {active && (
                        <motion.span
                          layoutId="filter-pill"
                          className="absolute inset-0 bg-slate-700 rounded-full"
                          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-slate-400'}`}>
                        {f === 'UNUSUAL' ? '⚠ Unusual' : f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase() + 's Only'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                    <tr>
                      {[['date', 'Date'], ['', 'Insider'], ['', 'Title'], ['', 'Type'], ['shares', 'Shares'], ['price', 'Price'], ['value', 'Value']].map(([col, label]) => (
                        <th
                          key={label}
                          onClick={col ? () => handleSort(col) : undefined}
                          className={`px-4 py-3 text-left ${col ? 'sortable cursor-pointer select-none hover:text-slate-300 transition-colors' : ''} ${['Shares', 'Price', 'Value'].includes(label) ? 'text-right' : ''} ${label === 'Type' ? 'text-center' : ''} ${sortCol === col ? (sortDir === 'asc' ? 'asc' : 'desc') : ''}`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Remount tbody on filter/sort change to re-trigger stagger */}
                  <motion.tbody
                    key={filter + sortCol + sortDir}
                    variants={{ visible: { transition: { staggerChildren: 0.035 } } }}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-slate-800/50"
                  >
                    {rows.length === 0 ? (
                      <motion.tr variants={rowVariants}>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">
                          Nothing matches that filter — try All to see the full picture.
                        </td>
                      </motion.tr>
                    ) : rows.map((t, i) => {
                      const isBuy = t.label === 'BUY';
                      const isSell = t.label === 'SELL';
                      const rowCls = isBuy ? 'row-buy' : isSell ? 'row-sell' : 'row-other';
                      const valCls = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-slate-300';
                      return (
                        <motion.tr
                          key={`${t.date}-${t.ownerName}-${i}`}
                          variants={rowVariants}
                          whileHover={{ x: 4, backgroundColor: 'rgba(30,41,59,0.7)' }}
                          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                          className={rowCls}
                          style={{ cursor: 'default' }}
                        >
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{t.date}</td>
                          <td className="px-4 py-3 text-white font-medium text-xs">{t.ownerName}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{t.title}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={isBuy ? 'badge-buy' : isSell ? 'badge-sell' : 'badge-other'}>{t.label}</span>
                            {isUnusual(t) && (
                              <motion.span
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                className="ml-1 badge-unusual"
                              >
                                ⚠
                              </motion.span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300 text-xs">{fmtNum(t.shares)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300 text-xs">{fmtPrice(t.price)}</td>
                          <td className={`px-4 py-3 text-right font-mono font-semibold text-xs ${valCls}`}>{fmtMoney(t.value)}</td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ── Explainer — scroll-triggered ── */}
      <InViewSection className="max-w-3xl mx-auto px-4 py-12">
        <motion.h2 variants={fadeUp} className="text-2xl font-bold text-white mb-4">
          The Information Wall Street Doesn&apos;t Want You to Find
        </motion.h2>
        <motion.p variants={fadeUp} className="text-slate-400 mb-4 leading-relaxed">
          Every time a CEO, CFO, or board member buys or sells their own company&apos;s stock, they&apos;re legally required to file a disclosure with the SEC within{' '}
          <strong className="text-slate-200">48 hours</strong>. It&apos;s called a{' '}
          <strong className="text-slate-200">Form 4</strong> — and it&apos;s been on a free government database since 1996. Hedge fund compliance desks monitor it daily.
        </motion.p>
        <motion.p variants={fadeUp} className="text-slate-400 mb-8 leading-relaxed">
          When a CEO spends <em>their own money</em> buying stock at market price, that&apos;s conviction. They know the pipeline, the deal flow, the numbers before they&apos;re public. InsiderRadar surfaces it automatically — no $200/month subscription required.
        </motion.p>

        {/* Info cards */}
        <motion.div variants={sectionStagger} className="grid md:grid-cols-3 gap-4">
          {[
            { tag: 'FORM 4', tagColor: 'text-emerald-400 border-emerald-800 bg-emerald-950/50', title: '48 Hours or Bust', body: 'Insiders must report every trade within 2 business days. We parse those filings straight from SEC EDGAR — no middleman, no markup.' },
            { tag: 'FLAGGED', tagColor: 'text-amber-400 border-amber-800 bg-amber-950/50', title: 'Not Just Listed', body: 'Open-market purchases over $500K get flagged as unusual — because a CEO writing a personal check for half a million at market price is not routine.' },
            { tag: '13F', tagColor: 'text-blue-400 border-blue-800 bg-blue-950/50', title: 'Follow the Funds Too', body: 'Hedge funds with $100M+ must disclose every stock position quarterly. Use our 13F tracker to see where the smart money is allocated.' },
          ].map(card => (
            <motion.div
              key={card.tag}
              variants={fadeUp}
              whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div className="mb-3">
                <span className={`font-mono text-xs border px-2 py-1 rounded ${card.tagColor}`}>{card.tag}</span>
              </div>
              <h3 className="font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-slate-400 text-sm">{card.body}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA row */}
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
          {[
            { href: '/unusual-activity', label: '⚠ See What\'s Flagged Right Now →', className: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold' },
            { href: '/fund-tracker', label: 'Follow the Hedge Funds →', className: 'bg-slate-800 hover:bg-slate-700 text-white' },
            { href: '/how-to-read-form4-13f', label: 'Learn to Read Form 4 →', className: 'bg-slate-800 hover:bg-slate-700 text-white' },
          ].map(({ href, label, className }) => (
            <motion.a
              key={href}
              href={href}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', damping: 18, stiffness: 320 }}
              className={`${className} px-4 py-2 rounded-lg text-sm transition-colors`}
            >
              {label}
            </motion.a>
          ))}
        </motion.div>
      </InViewSection>

      <div className="max-w-6xl mx-auto px-4 pb-4">
        <div id="ezoic-pub-ad-placeholder-103" />
      </div>
    </>
  );
}
