'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, Calculator, MapPin, Sparkles } from 'lucide-react';
import { CollegeSearchHero } from '@/components/search/college-search-hero';

export default function HomePage() {
  const verifiedColleges = [
    { name: 'Amity University, Noida', slug: 'amity-university-noida' },
    { name: 'IIT Delhi', slug: 'iit-delhi' },
    { name: 'DU North Campus', slug: 'delhi-university-north-campus' },
  ];

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-16 max-w-6xl mx-auto space-y-12">
      {/* Hero Header Section */}
      <section className="text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#DCE8E2] text-[#173327]">
          <Sparkles className="w-3.5 h-3.5 text-[#E06D3B]" />
          <span>Apna Ghar • Har Sahar Apna Ghar</span>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#173327] tracking-tight leading-tight">
            Find Trust-Verified Student Housing Near Your Campus
          </h1>
          <p className="text-sm sm:text-base text-[#3D3A33] max-w-2xl mx-auto leading-relaxed">
            Every property is physically geo-audited, inventory freshness is tracked in real-time,
            and total living cost is transparent before you pay a single rupee.
          </p>
        </div>

        {/* Live College Search Box */}
        <div className="pt-2">
          <CollegeSearchHero />
        </div>

        {/* Quick Access Anchor Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs font-semibold text-[#3D3A33]">Popular campuses:</span>
          {verifiedColleges.map((college) => (
            <Link
              key={college.slug}
              href={`/search?college=${college.slug}&radius=3000`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-[#ECE8DD] text-[#173327] hover:border-[#173327] hover:text-[#E06D3B] transition-colors shadow-xs"
            >
              <MapPin className="w-3 h-3 text-[#173327]" />
              {college.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Transparency Pillars */}
      <section className="py-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#173327] tracking-tight">
            The Apna Ghar Trust Standard
          </h2>
          <p className="text-xs sm:text-sm text-[#3D3A33]">
            Built specifically to solve student rental scams and hidden charges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-6 rounded-2xl border border-[#ECE8DD] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCE8E2] text-[#173327] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#173327]">Trust Passport</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              7-point verified audit: Owner KYC, physical geo-location, real photos, verified pricing, actual inventory, and house agreements.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#ECE8DD] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAEBDE] text-[#E06D3B] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#173327]">Availability Freshness</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              Real-time bed availability verified through atomic distributed locks and periodic owner audits. No phantom vacancies.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#ECE8DD] bg-white shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECE8DD] text-[#3D3A33] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#173327]">Total Living Cost</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              No surprise bills at month-end. Complete upfront transparency on rent, security deposit, electricity meter rates, food, and maintenance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ECE8DD] pt-6 pb-2 flex flex-col md:flex-row items-center justify-between text-xs text-[#3D3A33] gap-4">
        <p>© 2026 Apna Ghar Technologies. Har Sahar Apna Ghar.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>College-Anchored Search</span>
          <span>•</span>
          <span>MongoDB $geoNear 2dsphere</span>
          <span>•</span>
          <span>Redis Temporary Holds</span>
          <span>•</span>
          <span>Argon2id Auth</span>
        </div>
      </footer>
    </main>
  );
}

