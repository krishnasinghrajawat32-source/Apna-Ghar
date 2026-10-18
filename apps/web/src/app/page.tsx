'use client';

import React from 'react';
import { ShieldCheck, Clock, Calculator } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-8 md:p-16 max-w-5xl mx-auto">
      <header className="flex items-center justify-between border-b border-[#ECE8DD] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-xl tracking-tight shadow-sm">
            AG
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#173327]">
              APNA GHAR
            </h1>
            <p className="text-xs text-[#E06D3B] font-medium tracking-wide">
              Har Sahar Apna Ghar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCE8E2] text-[#173327]">
            Phase 0: Engineering Foundation
          </span>
        </div>
      </header>

      <section className="py-12 space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#173327] tracking-tight">
            Trust-First Verified Student Living Platform
          </h2>
          <p className="text-base md:text-lg text-[#3D3A33] max-w-2xl leading-relaxed">
            Engineered from scratch as a production-grade student living platform.
            Solving verified accommodation, real-time availability freshness, and total living cost transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-xl border border-[#ECE8DD] bg-white shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#DCE8E2] text-[#173327] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#173327]">Trust Passport</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              7-point verified audit: Owner KYC, physical geo-location, photos, real pricing, amenities, inventory, and legal documents.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#ECE8DD] bg-white shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#FAEBDE] text-[#E06D3B] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#173327]">Availability Freshness</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              Real-time bed state tracking with audit timestamps. Never displays stale or fabricated room availability.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-[#ECE8DD] bg-white shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-md bg-[#ECE8DD] text-[#3D3A33] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#173327]">Total Living Cost</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              Zero hidden charges. Transparent breakdown of rent, food, electricity estimate, laundry, maintenance, and commute.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#ECE8DD] pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#3D3A33] gap-4">
        <p>© 2026 Apna Ghar Technologies. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span>Modular Monolith NestJS API</span>
          <span>•</span>
          <span>Next.js App Router</span>
          <span>•</span>
          <span>MongoDB GeoJSON</span>
          <span>•</span>
          <span>Redis Distributed Locks</span>
        </div>
      </footer>
    </main>
  );
}
