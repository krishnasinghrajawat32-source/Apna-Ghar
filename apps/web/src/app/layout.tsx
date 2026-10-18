import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Navbar } from '@/components/layout/navbar';

import { ActiveHoldBanner } from '@/components/inventory/active-hold-banner';

export const metadata: Metadata = {
  title: 'Apna Ghar — Har Sahar Apna Ghar',
  description: 'Trust-First Verified Student Living Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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