export const metadata = {
  title: 'How to Read Form 4 and 13F Filings',
  description: 'A complete guide to reading SEC Form 4 insider trading filings and 13F institutional holdings reports. Learn what each field means and how to spot signals.',
};

export default function HowToPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-xs text-emerald-400 border border-emerald-800 bg-emerald-950/50 px-2 py-1 rounded inline-block mb-4">GUIDE</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">How to Read Form 4 and 13F Filings</h1>
          <p className="text-slate-400">A practical guide for retail investors — what every field means, what to look for, and what to ignore.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <div id="ezoic-pub-ad-placeholder-102" />

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Part 1: Understanding Form 4</h2>
          <p className="text-slate-400 leading-relaxed mb-4">Form 4 is filed with the SEC whenever a company insider — an officer, director, or 10%+ shareholder — buys or sells their company&apos;s stock. They have exactly 2 business days. These filings are public the moment they&apos;re accepted.</p>

          <h3 className="text-lg font-semibold text-white mt-6 mb-3">Transaction Codes — What Each Letter Means</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Meaning</th>
                  <th className="px-4 py-3 text-left">Signal?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  ['P', 'Open-market purchase — insider paid cash at market price', 'Strong bullish signal'],
                  ['S', 'Open-market sale — insider sold at market price', 'Worth noting, context matters'],
                  ['A', 'Award — shares granted as compensation', 'No signal, routine'],
                  ['M', 'Option exercise — converting options to shares', 'Neutral, often followed by S'],
                  ['F', 'Tax withholding — shares withheld to cover taxes', 'No signal, automatic'],
                  ['D', 'Disposition — shares returned or surrendered', 'Rare, context-dependent'],
                  ['G', 'Gift — shares donated or gifted', 'No signal'],
                ].map(([code, meaning, signal]) => (
                  <tr key={code} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{code}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{meaning}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">What to Focus On</h3>
          <ul className="text-slate-400 space-y-3 text-sm leading-relaxed">
            <li><span className="text-emerald-400 font-semibold">Code P (open-market purchase)</span> is the only transaction type that represents a genuine signal. The insider chose to spend their own cash at whatever the stock was trading at. No one forced them.</li>
            <li><span className="text-white font-semibold">Cluster buying</span> — multiple executives buying in the same 30-day window — is a stronger signal than a single purchase, even a large one.</li>
            <li><span className="text-white font-semibold">Size relative to salary</span> matters. A $50K buy from a CEO making $10M/year is noise. A $2M buy is not.</li>
            <li><span className="text-white font-semibold">Sells are ambiguous</span>. Insiders sell for many reasons — diversification, estate planning, a house purchase. Buys have exactly one reason.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Part 2: Understanding 13F Filings</h2>
          <p className="text-slate-400 leading-relaxed mb-4">Any institutional manager controlling $100M+ in US equities must disclose their full long equity portfolio every quarter. Filed within 45 days of each quarter end. Covers Q1 (due May 15), Q2 (Aug 14), Q3 (Nov 14), Q4 (Feb 14).</p>

          <h3 className="text-lg font-semibold text-white mt-6 mb-3">What 13F Data Tells You</h3>
          <ul className="text-slate-400 space-y-3 text-sm leading-relaxed">
            <li><span className="text-white font-semibold">Portfolio construction</span> — what sectors and positions a fund has conviction on over multiple quarters.</li>
            <li><span className="text-white font-semibold">New positions</span> — stocks that appear for the first time in a fund&apos;s filing. Often the most interesting data point.</li>
            <li><span className="text-white font-semibold">Position sizing</span> — how much of the portfolio a fund has allocated to each stock. A 10% position is very different from a 0.1% position.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mt-8 mb-3">What 13F Data Does NOT Tell You</h3>
          <ul className="text-slate-400 space-y-3 text-sm leading-relaxed">
            <li>Short positions — 13F only covers long equity. A fund can report 5 million shares long while simultaneously being net short.</li>
            <li>Options strategies — calls and puts are sometimes disclosed but often excluded.</li>
            <li>Current positions — data can be up to 135 days stale by the time you read it.</li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Search Insider Trades →</a>
          <a href="/fund-tracker" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Track a Fund →</a>
          <a href="/faq" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Read the FAQ →</a>
        </div>
      </main>
      <div className="max-w-3xl mx-auto px-4 pb-4"><div id="ezoic-pub-ad-placeholder-103" /></div>
    </>
  );
}
