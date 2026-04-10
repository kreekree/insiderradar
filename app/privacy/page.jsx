export const metadata = { title: 'Privacy Policy', description: 'InsiderRadar privacy policy — data collection, cookies, analytics, and advertising disclosure.' };

export default function PrivacyPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-500 text-sm font-mono">Last updated: April 2026</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-slate-400 leading-relaxed text-sm">
        <section><h2 className="text-lg font-bold text-white mb-2">Information We Collect</h2><p>InsiderRadar does not require registration or account creation. We do not collect personal information such as name, email address, or financial data. We collect anonymized usage data through Google Analytics 4 (page views, session duration, geographic region) to understand how users interact with the site.</p></section>
        <section><h2 className="text-lg font-bold text-white mb-2">Cookies</h2><p>We use cookies for analytics (Google Analytics) and advertising (Ezoic). These cookies may collect information about your browsing behavior to serve relevant ads. You can opt out of Google Analytics by using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google Analytics Opt-out Browser Add-on</a>.</p></section>
        <section><h2 className="text-lg font-bold text-white mb-2">Advertising</h2><p>This site is monetized through Ezoic display advertising. Ezoic and its advertising partners may use cookies and similar technologies to serve personalized ads based on your interests. For more information, see <a href="https://www.ezoic.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Ezoic&apos;s Privacy Policy</a>.</p></section>
        <section><h2 className="text-lg font-bold text-white mb-2">Third-Party Data</h2><p>All financial data displayed on InsiderRadar is sourced from the US SEC&apos;s public EDGAR database. We do not store, sell, or share any user data with financial data providers.</p></section>
        <section><h2 className="text-lg font-bold text-white mb-2">Contact</h2><p>For privacy-related questions, contact us at <a href="/contact" className="text-emerald-400 hover:underline">our contact page</a>.</p></section>
      </main>
    </>
  );
}
