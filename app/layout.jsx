import { JetBrains_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: { default: 'InsiderRadar — Free SEC Insider Trading Tracker', template: '%s | InsiderRadar' },
  description: 'Track insider buys and sells from SEC Form 4 filings in real time. Free SEC insider trading tracker — search any US stock ticker.',
  metadataBase: new URL('https://www.getinsidersignal.com'),
  openGraph: { siteName: 'InsiderRadar', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mono.variable}>
      <head>
        <script src="//www.ezojs.com/ezoic/sa.min.js" async />
        {process.env.NEXT_PUBLIC_UMAMI_ID && (
          <script defer src="https://umami-production-943c.up.railway.app/script.js" data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID} />
        )}
      </head>
      <body>
        <Nav />
        {children}
        <Footer />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
