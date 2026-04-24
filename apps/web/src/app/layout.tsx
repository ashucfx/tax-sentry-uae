import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TaxSentry — UAE Free Zone Tax Compliance',
  description:
    'Protect your 0% corporate tax status. Monitor NQI de-minimis thresholds and substance requirements in real time.',
  keywords: ['UAE', 'QFZP', 'free zone', 'corporate tax', 'de-minimis', 'TaxSentry'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
