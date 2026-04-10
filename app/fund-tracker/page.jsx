'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShimmerButton } from '@/components/magicui/shimmer-button';

function fmtMoney(n) {
  if (!n) return '$—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + Number(n).toLocaleString();
}

const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const heroItem = {
  hidden: { y: 20, opacity: 0, filter: 'blur(6px)' },
  visible: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { type: 'spring', damping: 22, stiffness: 200 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 280 } },
};

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
      <motion.header
        variants={heroStagger}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-4"
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={heroItem} className="mb-4">
            <span className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-400 text-xs px-3 py-1 rounded-full">
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-blue-400 inline-block"
              />
              13F filings — updated quarterly
            </span>
          </motion.div>

          <motion.h1 variants={heroItem} className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Hedge Fund Holdings Tracker
          </motion.h1>

          <motion.p variants={heroItem} className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Every hedge fund managing over $100M must disclose their stock positions every quarter.
            Search any fund to see exactly where the smart money is sitting.
          </motion.p>

          <motion.div variants={heroItem} className="flex gap-3 max-w-md mx-auto">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Berkshire, Renaissance, Citadel…"
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', damping: 16, stiffness: 320 }}
            >
              <ShimmerButton onClick={doSearch} disabled={loading} background="rgba(59,130,246,1)">
                {loading ? '…' : 'Search'}
              </ShimmerButton>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: -8, x: 0 }}
                animate={{ opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-red-400 text-xs mt-2 font-mono"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="flex justify-center mb-4">
              <div className="scan-track" style={{ '--scan-color': '#3b82f6' }}>
                <div className="scan-bar" style={{ background: 'linear-gradient(90deg,transparent,#3b82f6,transparent)' }} />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-mono">Fetching 13F filing from SEC EDGAR…</p>
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.main
            key={result.fund}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 py-6"
          >
            {/* Fund header card */}
            <motion.div
              initial={{ y: 28, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 240, delay: 0.1 }}
                    className="text-xl font-bold text-white"
                  >
                    {result.fund}
                  </motion.h2>
                  <p className="text-slate-400 text-sm">
                    Period: <span className="font-mono">{result.period}</span> · Filed: <span className="font-mono">{result.fileDate}</span>
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 280, delay: 0.15 }}
                  className="text-slate-400 text-sm font-mono"
                >
                  {result.holdingCount} positions
                </motion.div>
              </div>
            </motion.div>

            {/* Holdings table */}
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 24, stiffness: 200, delay: 0.08 }}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
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
                  <motion.tbody
                    variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-slate-800/50"
                  >
                    {(result.holdings || []).map((h, i) => {
                      const pct = Math.round((h.value / maxVal) * 100);
                      return (
                        <motion.tr
                          key={i}
                          variants={rowVariants}
                          whileHover={{ x: 4, backgroundColor: 'rgba(30,41,59,0.6)' }}
                          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                        >
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-3 text-white font-medium text-xs">{h.nameOfIssuer}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{h.titleOfClass}</td>
                          <td className="px-4 py-3 text-right text-blue-400 font-mono font-semibold text-xs">{fmtMoney(h.value)}</td>
                          <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">{Number(h.shares).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="w-24 bg-slate-800 rounded h-1.5 overflow-hidden">
                              <motion.div
                                className="bg-blue-500 h-1.5 rounded"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ type: 'spring', damping: 22, stiffness: 80, delay: i * 0.025 }}
                              />
                            </div>
                          </td>
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

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-white mb-3">What Is a 13F Filing?</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          Any institutional investment manager with over $100 million in assets under management must file a Form 13F
          with the SEC within 45 days of each quarter end. This lists every equity position they hold — the exact number
          of shares and the market value at quarter end.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          Funds like Berkshire Hathaway, Renaissance Technologies, and Citadel file 13Fs every quarter. Following their
          moves gives retail investors insight into where institutional money is flowing — before it becomes mainstream news.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <motion.a
            href="/"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', damping: 18, stiffness: 320 }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors inline-block"
          >
            Track Insider Trades →
          </motion.a>
          <motion.a
            href="/unusual-activity"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', damping: 18, stiffness: 320 }}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors inline-block"
          >
            See Unusual Buying →
          </motion.a>
        </div>
      </section>
    </>
  );
}
