import type { Metadata } from 'next';
import './globals.css';
import { ProfileProvider } from '@/context/ProfileContext';
import ThemeProviderClient from '@/components/ThemeProviderClient';

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
          <ProfileProvider>{children}</ProfileProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
