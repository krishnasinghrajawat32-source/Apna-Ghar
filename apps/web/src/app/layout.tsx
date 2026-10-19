import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Navbar } from '@/components/layout/navbar';
import { ActiveHoldBanner } from '@/components/inventory/active-hold-banner';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://apnaghar.in';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Apna Ghar — Har Sahar Apna Ghar | Verified Student Accommodation',
    template: '%s | Apna Ghar',
  },
  description:
    "India's premier trust-first student accommodation platform. 7-point physical Trust Passport verification, exact room & bed selection, 0 hidden fees, rotating mess menus, and verified resident reviews.",
  keywords: [
    'student accommodation',
    'student housing',
    'hostel booking',
    'PG near college',
    'student flat',
    'trust passport',
    'verified resident reviews',
    'mess meal subscription',
    'Apna Ghar',
  ],
  authors: [{ name: 'Apna Ghar Technologies' }],
  creator: 'Apna Ghar',
  publisher: 'Apna Ghar Technologies Pvt. Ltd.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: 'Apna Ghar',
    title: 'Apna Ghar — Har Sahar Apna Ghar | Verified Student Living',
    description:
      'Discover safe, verified student accommodation near major universities with exact room selection and 0 hidden fees.',
    images: [
      {
        url: `${APP_URL}/og-banner.png`,
        width: 1200,
        height: 630,
        alt: 'Apna Ghar — Har Sahar Apna Ghar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apna Ghar — Har Sahar Apna Ghar',
    description:
      'Verified student accommodation with 7-point Trust Passport audits and exact bed holds.',
    images: [`${APP_URL}/og-banner.png`],
  },
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
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Apna Ghar',
  url: APP_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${APP_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#FCFBF7] text-[#1E252B] antialiased flex flex-col">
        <QueryProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <ActiveHoldBanner />
        </QueryProvider>
      </body>
    </html>
  );
}