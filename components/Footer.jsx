import Link from 'next/link';

const links = ['/', '/unusual-activity', '/fund-tracker', '/how-to-read-form4-13f', '/blog', '/faq', '/methodology', '/privacy', '/contact'];
const labels = ['Tracker', 'Unusual Activity', 'Fund Tracker', 'Learn', 'Blog', 'FAQ', 'Methodology', 'Privacy', 'Contact'];

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 mt-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          {links.map((href, i) => (
            <Link key={href} href={href} className="hover:text-white transition">{labels[i]}</Link>
          ))}
        </div>
        <p className="text-slate-600 text-xs text-center">
          This site is for informational purposes only. Not financial or investment advice. &copy; 2026 InsiderRadar.com
        </p>
      </div>
    </footer>
  );
}
