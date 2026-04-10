'use client';
import { motion } from 'framer-motion';

function fmtNum(n) { return Number(n).toLocaleString(); }
function fmtMoney(n) {
  if (!n) return '$—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}
function fmtPrice(p) { return p ? '$' + Number(p).toFixed(2) : '$—'; }

const rowVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 280 } },
};

export function UnusualTable({ trades }) {
  return (
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
          <motion.tbody
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="visible"
            className="divide-y divide-slate-800/50"
          >
            {trades.length === 0 ? (
              <motion.tr variants={rowVariants}>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                  No unusual activity found in the last 30 days. Check back soon.
                </td>
              </motion.tr>
            ) : trades.map((t, i) => (
              <motion.tr
                key={i}
                variants={rowVariants}
                whileHover={{ x: 4, backgroundColor: 'rgba(16,185,129,0.05)' }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="row-buy"
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-white font-mono text-xs">{t.ticker || t.issuer}</span>
                  <span className="text-slate-500 text-xs block">{t.issuer}</span>
                </td>
                <td className="px-4 py-3 text-slate-200 text-xs">{t.ownerName}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{t.title}</td>
                <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">{fmtNum(t.shares)}</td>
                <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs">{fmtPrice(t.price)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono text-xs">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 + 0.2 }}
                  >
                    {fmtMoney(t.value)}
                  </motion.span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
