export const metadata = { title: 'Data & Methodology', description: 'How InsiderRadar sources, processes, and displays SEC Form 4 insider trading data and 13F institutional holdings. Data sources, calculation methods, and update frequency.' };

export default function MethodologyPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white mb-3">Data & Methodology</h1>
          <p className="text-slate-400">Where the data comes from, how it&apos;s processed, and what the numbers mean.</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8 text-slate-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Data Sources</h2>
          <p className="mb-3">All data on InsiderRadar is sourced directly from the US Securities and Exchange Commission&apos;s public EDGAR system. No third-party data vendors are used.</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                <tr><th className="px-4 py-3 text-left">Endpoint</th><th className="px-4 py-3 text-left">Used For</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  ['sec.gov/files/company_tickers.json', 'Ticker → CIK mapping (all US public companies)'],
                  ['efts.sec.gov/LATEST/search-index', 'Full-text search for Form 4 and 13F filings'],
                  ['data.sec.gov/submissions/CIK{cik}.json', 'Company metadata and filing history'],
                  ['sec.gov/Archives/edgar/data/', 'Raw Form 4 XML and 13F InfoTable XML files'],
                ].map(([ep, use]) => (
                  <tr key={ep} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-emerald-400 text-xs">{ep}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Form 4 Processing</h2>
          <p>When you search a ticker, InsiderRadar queries the EDGAR full-text search API for Form 4 filings mentioning that company&apos;s CIK number in the last 90 days. For each filing, we download the XML document directly from the EDGAR Archives and parse the nonDerivativeTransaction blocks for transaction data.</p>
          <p className="mt-3">We process filings in batches of 4 in parallel, with a 300ms gap between batches, to stay within SEC&apos;s rate limits. Results are cached at the edge for 1 hour.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Unusual Activity Threshold</h2>
          <p>A trade is flagged as unusual when: (1) the transaction code is P (open-market purchase), and (2) the total value (shares × price) exceeds $500,000. This threshold was chosen to filter for meaningfully large discretionary purchases while excluding routine small transactions.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">13F Processing</h2>
          <p>Fund holdings are retrieved by searching EDGAR for 13F-HR filings matching the fund name. The most recent filing&apos;s InfoTable XML is parsed for holdings data. Values are reported in thousands of dollars as per the 13F standard — we multiply by 1,000 for display. Holdings are sorted by value and limited to the top 50 positions.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Limitations</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>Form 4 data covers the last 90 days of filings returned by the EDGAR search API</li>
            <li>13F data reflects each fund&apos;s most recent quarterly filing, which may be up to 135 days old</li>
            <li>API results are cached for 1 hour to respect SEC rate limits</li>
            <li>Some older Form 4 filings may use non-standard XML formats and may not parse correctly</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 mt-8">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Use the Tracker →</a>
          <a href="/faq" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Read the FAQ →</a>
        </div>
      </main>
    </>
  );
}
