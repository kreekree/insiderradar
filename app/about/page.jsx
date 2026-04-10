export const metadata = { title: 'About InsiderRadar', description: 'InsiderRadar is a free SEC insider trading and institutional fund flow tracker built to give retail investors access to the same data hedge funds monitor daily.' };

export default function AboutPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white mb-3">About InsiderRadar</h1>
          <p className="text-slate-400">Why we built this and what we&apos;re trying to do.</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-slate-400 leading-relaxed">
        <p>InsiderRadar is a free SEC insider trading and institutional fund flow tracker. We built it because the data was always public — it just wasn&apos;t accessible. SEC EDGAR publishes every Form 4 filing within hours of submission. Hedge fund compliance desks monitor it daily. Retail investors had no clean way to see it without paying $200/month to WhaleWisdom or Fintel.</p>
        <p>We changed that. Type in any US stock ticker and see every insider trade from the last 90 days — who bought, who sold, how much, at what price, and whether it was a genuine open-market purchase or just an automated stock award. The data comes directly from <a href="https://www.sec.gov/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">SEC EDGAR</a>. No intermediaries, no markup, no subscription.</p>
        <p>We also track 13F institutional holdings — the quarterly disclosures that reveal exactly what every major hedge fund owns. Search any fund by name to see their latest portfolio.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 my-6">
          <p className="text-slate-300 font-semibold mb-2">Data last updated</p>
          <p className="text-slate-400 text-sm">Form 4 data: refreshed every hour per search. Unusual activity feed: refreshed hourly. 13F data: refreshed per search, reflects most recent quarterly filing.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-8">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Use the Tracker →</a>
          <a href="/contact" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Contact →</a>
        </div>
      </main>
    </>
  );
}
