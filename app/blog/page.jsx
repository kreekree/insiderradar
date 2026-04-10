import Link from 'next/link';

export const metadata = { title: 'Blog — SEC Insider Trading Insights', description: 'Articles on SEC Form 4 insider trading data, 13F institutional holdings, and how to use public government data in your investment research.' };

const posts = [
  { slug: 'what-is-form-4', title: 'What Is SEC Form 4? A Complete Guide for Retail Investors', date: '2026-03-15', excerpt: 'Form 4 is one of the most powerful — and least understood — public documents in the US financial system. Here\'s everything you need to know.' },
  { slug: 'how-to-track-13f', title: 'How to Track 13F Filings: Following the Smart Money', date: '2026-03-20', excerpt: 'Hedge funds managing over $100M must disclose their stock holdings every quarter. Here\'s how to read those filings and what to actually look for.' },
];

export default function BlogPage() {
  return (
    <>
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Blog</h1>
          <p className="text-slate-400">Deep dives on SEC data, insider trading signals, and how to use public government filings in your research.</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-6">
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
              <div className="text-xs text-slate-500 font-mono mb-2">{post.date}</div>
              <h2 className="text-lg font-bold text-white mb-2">{post.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{post.excerpt}</p>
              <span className="text-emerald-400 text-sm mt-3 inline-block">Read more →</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
