import type { Metadata } from 'next';
import './globals.css';
import { ProfileProvider } from '@/context/ProfileContext';
import ThemeProviderClient from '@/components/ThemeProviderClient';
import ToasterProvider from '@/components/ToasterProvider';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trading Journal — Track, Analyze, Improve',
  description:
    'A clean, modern trading journal to log your trades, track P&L, and analyze your performance with an interactive calendar view.',
  keywords: 'trading journal, trade tracker, P&L, portfolio, stocks, crypto, forex',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProviderClient>
          <ProfileProvider>
            <div className="w-full border-b border-neutral-200/50 bg-journal-card/40">
              <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-start gap-4">
                <Link href="/journal" className="font-bold">Journal</Link>
                <Link href="/plans" className="font-bold">Trade Plans</Link>
              </div>
            </div>
            {children}
            <ToasterProvider />
          </ProfileProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
