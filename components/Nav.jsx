'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Tracker' },
  { href: '/unusual-activity', label: 'Unusual Activity' },
  { href: '/fund-tracker', label: 'Fund Tracker' },
  { href: '/how-to-read-form4-13f', label: 'Learn' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-emerald-400">&#9679;</span>
          <span className="text-white">Insider<span className="text-emerald-400">Radar</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? 'text-white font-medium' : 'hover:text-white transition'}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pb-4">
          <div className="flex flex-col gap-3 pt-3 text-sm text-slate-300">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-white" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
