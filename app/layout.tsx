import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'BGD Mart Admin', template: '%s | BGD Mart Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
