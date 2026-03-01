import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d0d0d',
};

export const metadata: Metadata = {
  title: 'Eral — WokSpec AI',
  description: 'Your AI. Built into WokSpec. Chat, generate, and analyze with Eral.',
  metadataBase: new URL('https://eral.wokspec.org'),
  openGraph: {
    type: 'website',
    siteName: 'Eral',
    url: 'https://eral.wokspec.org',
    title: 'Eral — WokSpec AI',
    description: 'Your AI. Built into WokSpec.',
    images: [{ url: '/og.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@wokspec' },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#0d0d0d' }}>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
