export const metadata = { title: 'What Is SEC Form 4? A Complete Guide', description: 'SEC Form 4 is a mandatory insider trading disclosure filed within 48 hours of any transaction. Learn what it is, who files it, and how to read it.' };

export default function WhatIsForm4Page() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-xs text-emerald-400 border border-emerald-800 bg-emerald-950/50 px-2 py-1 rounded inline-block mb-4">FORM 4</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">What Is SEC Form 4? A Complete Guide for Retail Investors</h1>
          <p className="text-slate-500 text-sm font-mono">Published March 15, 2026</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-invert prose-slate max-w-none">
        <div id="ezoic-pub-ad-placeholder-102" className="mb-8 not-prose" />
        <p className="text-slate-400 leading-relaxed mb-6">SEC Form 4 is one of the most powerful — and least understood — public documents in the US financial system. It&apos;s free. It&apos;s public. It&apos;s filed within 48 hours of every insider transaction. And most retail investors have never looked at one.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">What Is Form 4?</h2>
        <p className="text-slate-400 leading-relaxed mb-4">Form 4 is a disclosure document filed with the US Securities and Exchange Commission under Section 16(a) of the Securities Exchange Act of 1934. It must be filed by any corporate insider — defined as an officer, director, or beneficial owner of more than 10% of a company&apos;s equity securities — within two business days of any transaction involving that company&apos;s stock.</p>
        <p className="text-slate-400 leading-relaxed mb-4">The filing captures the who, what, when, and how much of every insider trade. It&apos;s publicly available on the SEC&apos;s EDGAR database the moment it&apos;s accepted — usually within hours of filing.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Who Has to File Form 4?</h2>
        <ul className="text-slate-400 space-y-2 mb-6 list-disc pl-6">
          <li>Chief Executive Officers (CEOs)</li>
          <li>Chief Financial Officers (CFOs) and other C-suite officers</li>
          <li>Board of Directors members</li>
          <li>Shareholders owning more than 10% of any class of equity securities</li>
        </ul>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Why Does This Matter to You?</h2>
        <p className="text-slate-400 leading-relaxed mb-4">When a CEO buys $2 million of their own company&apos;s stock in the open market, they&apos;re making a statement. They know the product roadmap. They know the next earnings report is coming. They know what deals are in the pipeline. And they decided — with their own money, at market price — that the stock is worth buying right now.</p>
        <p className="text-slate-400 leading-relaxed mb-4">Academic research published in the Journal of Financial Economics has consistently shown that clusters of insider buying — particularly by high-ranking officers making large open-market purchases — tend to precede positive stock returns over 6-12 month horizons. This is not a secret. Hedge fund compliance desks monitor Form 4 filings daily. Now you can too.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Signal vs. The Noise</h2>
        <p className="text-slate-400 leading-relaxed mb-4">Not all Form 4 transactions are created equal. The one you care about is transaction code <strong className="text-white">P — open-market purchase</strong>. Everything else is largely noise:</p>
        <ul className="text-slate-400 space-y-2 mb-6 list-disc pl-6">
          <li><strong className="text-white">A (Award)</strong> — shares granted as compensation. The insider paid nothing. Zero signal.</li>
          <li><strong className="text-white">M (Option Exercise)</strong> — converting options to shares. Usually followed immediately by a sale. Neutral to slightly negative.</li>
          <li><strong className="text-white">F (Tax Withholding)</strong> — automatic. Not a decision. Ignore it.</li>
          <li><strong className="text-white">S (Sale)</strong> — worth noting, but context matters enormously. Insiders sell for many reasons unrelated to their view of the stock.</li>
        </ul>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 my-8 not-prose">
          <p className="text-slate-300 text-sm font-semibold mb-2">The bottom line:</p>
          <p className="text-slate-400 text-sm">An insider buy (code P) is a deliberate, voluntary decision to spend personal cash at whatever the market is offering. An insider sell could mean anything. Focus your attention accordingly.</p>
        </div>
        <p className="text-slate-400 leading-relaxed">InsiderRadar surfaces Form 4 data directly from SEC EDGAR in real time. <a href="/" className="text-emerald-400 hover:underline">Search any US stock ticker</a> to see the latest insider transactions — or check the <a href="/unusual-activity" className="text-emerald-400 hover:underline">unusual activity feed</a> for the largest open-market purchases across all companies in the last 30 days.</p>
        <div className="mt-10 not-prose flex flex-wrap gap-3">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Search Insider Trades →</a>
          <a href="/how-to-read-form4-13f" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Full Reading Guide →</a>
        </div>
      </main>
      <div className="max-w-3xl mx-auto px-4 pb-4"><div id="ezoic-pub-ad-placeholder-103" /></div>
    </>
  );
}
