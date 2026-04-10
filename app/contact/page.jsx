export const metadata = { title: 'Contact InsiderRadar', description: 'Contact the InsiderRadar team with questions, feedback, or data corrections.' };

export default function ContactPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white mb-3">Contact</h1>
          <p className="text-slate-400">Questions, feedback, or data corrections — we&apos;re listening.</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-4">Email us directly at:</p>
          <a href="mailto:contact@insiderradar.com" className="text-emerald-400 text-xl font-semibold hover:underline">contact@insiderradar.com</a>
          <p className="text-slate-600 text-sm mt-6">We aim to respond within 48 hours.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition">Use the Tracker →</a>
          <a href="/faq" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition">Check the FAQ →</a>
        </div>
      </main>
    </>
  );
}
