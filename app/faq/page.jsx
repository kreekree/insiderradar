'use client';
import { useState } from 'react';

export default function FaqPage() {
  const faqs = [
    { q: 'What is SEC Form 4 and who has to file it?', a: 'SEC Form 4 is a mandatory disclosure required under Section 16(a) of the Securities Exchange Act of 1934. Any corporate insider — officers (CEO, CFO, COO), board members, and shareholders owning more than 10% of a public company — must file within two business days of any transaction involving that company\'s securities. The form discloses who traded, what was traded, how many shares, at what price, and the type of transaction.' },
    { q: 'Is insider trading illegal? How is InsiderRadar different from illegal activity?', a: 'Not all insider trading is illegal. Corporate insiders buying or selling their own company\'s stock is completely legal as long as it\'s done without relying on material non-public information (MNPI) and properly reported via Form 4. Illegal insider trading occurs when someone trades based on confidential tips. InsiderRadar tracks the legal, publicly disclosed Form 4 filings that insiders are required by law to submit within 48 hours.' },
    { q: 'How quickly does insider trading data appear on InsiderRadar?', a: 'Insiders must file Form 4 within two business days. InsiderRadar fetches directly from SEC EDGAR, which publishes filings within hours of submission. Our API caches results for one hour to avoid rate-limiting, so data may be up to one hour delayed from EDGAR.' },
    { q: 'What does the Unusual Activity flag mean?', a: 'InsiderRadar flags an insider buy as unusual when the transaction value exceeds $500,000 in a single open-market purchase (Form 4 code P). Large discretionary purchases — where an executive spends significant personal capital at market prices — are meaningfully different from routine stock awards or option exercises.' },
    { q: 'What is a 13F filing and which funds file them?', a: 'Form 13F-HR is a quarterly filing required of institutional investment managers controlling over $100 million in US equity securities. This includes hedge funds, mutual funds, pension funds, and family offices. The filing lists all long equity positions and is due within 45 days after each calendar quarter ends.' },
    { q: 'Can I trust 13F data to know what a hedge fund currently holds?', a: '13F data is a historical snapshot, not a live feed. Because filings are due 45 days after quarter-end, the data could be up to 135 days old. A fund could have fully exited a position multiple times since filing. Use 13F data to understand long-term investment thesis, not to replicate trades in real time.' },
    { q: 'Does InsiderRadar cover all US stocks?', a: 'InsiderRadar covers all US publicly traded companies with Form 4 filings on SEC EDGAR — NYSE, Nasdaq, and most OTC-listed companies. Enter the stock ticker and we pull the latest Form 4 data directly from EDGAR.' },
    { q: 'Is InsiderRadar free? Do I need to sign up?', a: 'Yes, completely free. No subscription, no account registration, no paywall. All features are available without entering any personal information. The site is supported by display advertising.' },
    { q: 'Where does InsiderRadar get its data?', a: 'All data comes directly from the SEC\'s EDGAR system — the EDGAR full-text search API for filing discovery, data.sec.gov for company indexes, and the EDGAR Archives for Form 4 XML and 13F InfoTable XML files. No third-party data vendors.' },
    { q: 'What is the difference between a Buy and an Award on a Form 4?', a: 'A Buy (code P) means the insider spent their own money at market price — a discretionary, voluntary decision signaling personal conviction. An Award (code A) means the company granted shares as compensation; the insider paid nothing. Awards are not market signals. Unusual activity flags only apply to open-market purchases.' },
    { q: 'How should I use insider trading data in my investment research?', a: 'Use it as one input among many. Strong signals: multiple insiders buying in a short window, large purchases relative to historical activity, buys following a significant price decline, purchases by high-ranking officers. Combine with fundamental analysis and sector trends. Nothing on this site is financial advice.' },
  ];

  const [open, setOpen] = useState(null);

  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-slate-400">The questions retail investors ask when they realize this data was always public — and they just weren&apos;t told.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div id="ezoic-pub-ad-placeholder-102" className="mb-8" />
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left text-white font-semibold text-sm hover:bg-slate-800/40 transition"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{f.q}</span>
                <span className={`text-emerald-400 text-lg ml-4 shrink-0 transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-4">Have a question not answered here?</p>
          <a href="/contact" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2 rounded-lg text-sm transition mr-3">Contact Us</a>
          <a href="/" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-sm transition">Try the Tracker →</a>
        </div>
      </main>
      <div className="max-w-3xl mx-auto px-4 pb-4"><div id="ezoic-pub-ad-placeholder-103" /></div>
    </>
  );
}
