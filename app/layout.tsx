import '../styles/globals.css';
import React, { Suspense } from 'react';
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'LeadSense AI | HPCL B2B Lead Intelligence',
    template: '%s | LeadSense AI',
  },
  description: 'AI-powered B2B Lead Intelligence platform for HPCL Direct Sales. Transform market signals into actionable business opportunities.',
  keywords: ['HPCL', 'B2B leads', 'AI', 'sales intelligence', 'petroleum', 'oil and gas', 'lead generation', 'direct sales'],
  authors: [{ name: 'LeadSense AI Team' }],
  creator: 'HPCL Direct Sales',
  publisher: 'Hindustan Petroleum Corporation Limited',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'LeadSense AI',
    title: 'LeadSense AI | HPCL B2B Lead Intelligence',
    description: 'AI-powered B2B Lead Intelligence platform for HPCL Direct Sales',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LeadSense AI - HPCL B2B Lead Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadSense AI | HPCL B2B Lead Intelligence',
    description: 'AI-powered B2B Lead Intelligence platform for HPCL Direct Sales',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  category: 'business',
};

// Loading fallback for Suspense
function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading LeadSense AI...</p>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Suspense fallback={<GlobalLoading />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}

