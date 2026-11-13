'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, Calculator, MapPin, Sparkles, Building2, Users, Utensils, CheckCircle2, ArrowRight } from 'lucide-react';
import { CollegeSearchHero } from '@/components/search/college-search-hero';
import { ScrollHeroAnimation } from '@/components/home/scroll-hero-animation';

export default function HomePage() {
  const verifiedColleges = [
    { name: 'MANIT Bhopal', slug: 'manit-bhopal' },
    { name: 'IIT Indore', slug: 'iit-indore' },
    { name: 'DAVV Indore', slug: 'davv-indore' },
    { name: 'ABV-IIITM Gwalior', slug: 'abv-iiitm-gwalior' },
    { name: 'AIIMS Bhopal', slug: 'aiims-bhopal' },
  ];

  const mpCities = [
    { name: 'Bhopal', city: 'Bhopal', count: '21 Stays' },
    { name: 'Indore', city: 'Indore', count: '20 Stays' },
    { name: 'Gwalior', city: 'Gwalior', count: '21 Stays' },
  ];

  const stayCategories = [
    {
      title: 'Verified Student PGs',
      desc: 'Double & triple sharing with meal options and high-speed Wi-Fi',
      href: '/search?propertyType=PG',
      icon: Building2,
      badge: 'Popular',
    },
    {
      title: 'Hostels & Residencies',
      desc: 'Wardens, biometric security, and dedicated study rooms',
      href: '/search?propertyType=HOSTEL',
      icon: Users,
      badge: 'Secure',
    },
    {
      title: 'Student Flats & 1BHKs',
      desc: 'Independent living with full kitchen, zero broker intervention',
      href: '/search?propertyType=STUDENT_FLAT',
      icon: Building2,
      badge: 'Zero Brokerage',
    },
    {
      title: 'Hygienic Mess Plans',
      desc: 'FSSAI inspected student tiffins & rotating weekly regional menus',
      href: '/mess',
      icon: Utensils,
      badge: 'Fresh Daily',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* 3D Cinematic Scroll-Based Hero Animation */}
      <ScrollHeroAnimation />

      <div id="main-content-start" className="scroll-mt-12" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-6">
          {/* Brand Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#102B50]/10 text-[#102B50] border border-[#102B50]/15 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>HAR SAHAR APNA GHAR • INDIA'S VERIFIED STUDENT ECOSYSTEM</span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#102B50] tracking-tight leading-[1.15]">
              Find Trust-Verified Student Stays Near Your University
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#687586] max-w-2xl mx-auto leading-relaxed">
              Every property is physically geo-audited, bed availability is locked in real-time, and total living cost is transparent before you pay a single rupee.
            </p>
          </div>

          {/* College Search Box */}
          <div className="pt-2">
            <CollegeSearchHero />
          </div>

          {/* Quick Access MP City Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <span className="text-xs font-bold text-[#687586]">Explore MP Cities:</span>
            {mpCities.map((c) => (
              <Link
                key={c.city}
                href={`/search?city=${c.city}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#102B50] text-[#F5A623] hover:bg-[#183D68] hover:text-white transition-all shadow-xs"
              >
                <MapPin className="w-3 h-3 text-[#F5A623]" />
                <span>{c.name}</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{c.count}</span>
              </Link>
            ))}
          </div>

          {/* Quick Access Campus Anchor Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs font-bold text-[#687586]">MP Universities:</span>
            {verifiedColleges.map((college) => (
              <Link
                key={college.slug}
                href={`/search?college=${college.slug}&radius=5000`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E8E5DE] text-[#102B50] hover:border-[#102B50] hover:bg-[#F0F4F8] transition-all shadow-xs"
              >
                <MapPin className="w-3 h-3 text-[#F5A623]" />
                <span>{college.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Discovery */}
      <section className="py-12 bg-white border-y border-[#E8E5DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
              Tailored For University Life
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102B50] tracking-tight">
              Explore Accommodations by Living Style
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stayCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className="ag-card-hover p-6 rounded-2xl border border-[#E8E5DE] bg-white flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#102B50]/10 text-[#102B50] flex items-center justify-center group-hover:bg-[#102B50] group-hover:text-[#F5A623] transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-[#21865B] bg-[#21865B]/10 px-2.5 py-1 rounded-full">
                        {cat.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#102B50] group-hover:text-[#F5A623] transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-[#687586] mt-1.5 leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-[#102B50] group-hover:text-[#F5A623] transition-colors">
                    <span>Explore options</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
            Peace of Mind for Parents & Students
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#102B50] tracking-tight">
            The Apna Ghar Trust Standard
          </h2>
          <p className="text-xs sm:text-sm text-[#687586] leading-relaxed">
            Built specifically to solve student rental scams, fake photos, unexpected brokerage, and phantom room vacancies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-3xl border border-[#E8E5DE] bg-white shadow-brand-sm space-y-4 hover:shadow-brand-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#102B50]">7-Point Trust Passport</h3>
            <p className="text-xs text-[#687586] leading-relaxed">
              Every stay undergoes physical in-person verification: Owner KYC, geo-coordinates, real photographic evidence, verified electricity rates, and rental agreements.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#21865B]">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Physically Inspected</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-3xl border border-[#E8E5DE] bg-white shadow-brand-sm space-y-4 hover:shadow-brand-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#F5A623] text-[#102B50] flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#102B50]">Live Atomic Bed Locks</h3>
            <p className="text-xs text-[#687586] leading-relaxed">
              When you select a bed, our Redis distributed locking system holds that exact bed for 10 minutes so no one else can book it while you finalize your move.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#21865B]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero Phantom Vacancies</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-3xl border border-[#E8E5DE] bg-white shadow-brand-sm space-y-4 hover:shadow-brand-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center shadow-sm">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#102B50]">Total Living Cost</h3>
            <p className="text-xs text-[#687586] leading-relaxed">
              No surprise bills at month-end. Complete upfront transparency on base rent, refundable security deposits, electricity sub-meter units, maintenance, and food.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#21865B]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero Hidden Brokerage</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-[#102B50] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-brand-lg">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider">
              Are you a PG or Hostel Owner?
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              List Your Property on India's Verified Network
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl">
              Get verified student tenants directly from premier universities. Instant payouts, transparent agreements, zero broker commissions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/register?role=OWNER"
              className="ag-btn-accent text-center px-6 py-3.5 text-xs sm:text-sm font-bold shadow-md"
            >
              List Property Free
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-white/20 hover:bg-white/10 transition-colors text-white"
            >
              Browse Stays
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
