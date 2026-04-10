'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220, delay: 0.05 }}
      className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <motion.span
            whileHover={{ rotate: 180, scale: 1.3 }}
            transition={{ type: 'spring', damping: 10, stiffness: 180 }}
            className="text-emerald-400 inline-block leading-none"
          >
            &#9679;
          </motion.span>
          <span className="text-white">
            Insider<span className="text-emerald-400">Radar</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {links.map(l => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-1.5 rounded-md transition-colors duration-150 ${active ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-slate-800 rounded-md"
                    transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', damping: 16, stiffness: 300 }}
          className="md:hidden text-slate-400 hover:text-white p-1"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          <motion.svg
            animate={open ? 'open' : 'closed'}
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              variants={{
                closed: { d: 'M4 6h16M4 12h16M4 18h16' },
                open: { d: 'M6 18L18 6M6 6l12 12' },
              }}
              transition={{ duration: 0.25 }}
            />
          </motion.svg>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="md:hidden overflow-hidden border-t border-slate-800"
          >
            <div className="bg-slate-900 px-4 pb-4 pt-3 flex flex-col gap-1 text-sm">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', damping: 24, stiffness: 280 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block py-2 transition-colors ${pathname === l.href ? 'text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
