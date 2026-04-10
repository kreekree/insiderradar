export const metadata = { title: 'How to Track 13F Filings: Following the Smart Money', description: 'Hedge funds managing over $100M must disclose their stock holdings every quarter. Learn how to read 13F filings and what to look for.' };

export default function HowToTrack13FPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-xs text-blue-400 border border-blue-800 bg-blue-950/50 px-2 py-1 rounded inline-block mb-4">13F</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">How to Track 13F Filings: Following the Smart Money</h1>
          <p className="text-slate-500 text-sm font-mono">Published March 20, 2026</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div id="ezoic-pub-ad-placeholder-102" className="mb-8" />
        <p className="text-slate-400 leading-relaxed mb-6">Every quarter, the largest hedge funds in the world are required by law to tell you exactly what stocks they own. The filing is called a 13F-HR, and it&apos;s been public on the SEC&apos;s EDGAR database since 1978. Most retail investors have never looked at one.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">What Is a 13F Filing?</h2>
        <p className="text-slate-400 leading-relaxed mb-4">Form 13F-HR is a quarterly disclosure required of any institutional investment manager that exercises discretionary control over $100 million or more in qualifying US equity securities. This includes hedge funds, mutual funds, pension funds, family offices, and registered investment advisers.</p>
        <p className="text-slate-400 leading-relaxed mb-4">The filing must be submitted within 45 days of each calendar quarter end — so by May 15, August 14, November 14, and February 14. It lists every long equity position: the name of the security, the number of shares, the market value, and whether it&apos;s held directly or through options.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Which Funds File 13Fs?</h2>
        <p className="text-slate-400 leading-relaxed mb-4">Any manager over the $100M threshold — including firms you&apos;ve heard of:</p>
        <ul className="text-slate-400 space-y-2 mb-6 list-disc pl-6">
          <li>Berkshire Hathaway (Warren Buffett)</li>
          <li>Renaissance Technologies</li>
          <li>Citadel Advisors</li>
          <li>Bridgewater Associates</li>
          <li>Tiger Global Management</li>
          <li>Pershing Square Capital (Bill Ackman)</li>
        </ul>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">What to Look For</h2>
        <p className="text-slate-400 leading-relaxed mb-4"><strong className="text-white">New positions</strong> are the most interesting data point. When a fund that hasn&apos;t owned a stock suddenly appears with a significant position, that&apos;s worth investigating.</p>
        <p className="text-slate-400 leading-relaxed mb-4"><strong className="text-white">Position sizing</strong> tells you conviction level. A 0.1% portfolio weight is a speculative bet. A 10% position is a core thesis.</p>
        <p className="text-slate-400 leading-relaxed mb-4"><strong className="text-white">Consistency across quarters</strong> matters. A fund that holds and builds a position over 6+ quarters is demonstrating long-term conviction, not a trade.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Limitations</h2>
        <p className="text-slate-400 leading-relaxed mb-4">13F data has real limitations you need to understand before acting on it:</p>
        <ul className="text-slate-400 space-y-2 mb-6 list-disc pl-6">
          <li><strong className="text-white">It&apos;s stale.</strong> Data can be up to 135 days old. Funds can fully exit positions between filings.</li>
          <li><strong className="text-white">No short positions.</strong> A fund reporting 5M shares long could be net short the stock through options or swaps not required on the 13F.</li>
          <li><strong className="text-white">No bonds or commodities.</strong> 13F is equities only.</li>
        </ul>
        <p className="text-slate-400 leading-relaxed">Use <a href="/fund-tracker" className="text-emerald-400 hover:underline">InsiderRadar&apos;s Fund Tracker</a> to search any hedge fund by name and view their latest 13F holdings. Combine 13F data with Form 4 insider trades for a more complete picture of where conviction is building in any given stock.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="/fund-tracker" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">Search a Hedge Fund →</a>
          <a href="/" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Track Insider Trades →</a>
        </div>
      </main>
      <div className="max-w-3xl mx-auto px-4 pb-4"><div id="ezoic-pub-ad-placeholder-103" /></div>
    </>
  );
}
