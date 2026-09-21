import React from 'react';
import Link from 'next/link';
import { ShieldCheck, PhoneCall, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      {/* 24/7 Student Safety & Support Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Apna Ghar Verified Stays Standard:</span>
            <span className="text-slate-400">
              100% physically inspected properties, biometric locks & zero hidden charges.
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>24/7 Student Helpline:</span>
            <a href="tel:18001234567" className="underline hover:text-emerald-300">
              1800-123-GHAR
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">
                अ
              </div>
              <span className="font-bold text-white text-base tracking-tight">APNA GHAR</span>
            </div>
            <p className="text-slate-400 italic">"Har Safar, Apna Ghar"</p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              India's first student living ecosystem featuring 15-minute concurrency bed holds,
              verified campus proximity radius, and curated student meal subscriptions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              Accommodations
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link href="/search" className="hover:text-white transition">
                  Campus Proximity Search
                </Link>
              </li>
              <li>
                <Link href="/search?gender=FEMALE_ONLY" className="hover:text-white transition">
                  Girls Only Hostels & PGs
                </Link>
              </li>
              <li>
                <Link href="/search?gender=MALE_ONLY" className="hover:text-white transition">
                  Boys Accommodation
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-white transition">
                  Side-by-Side Property Comparison
                </Link>
              </li>
            </ul>
          </div>

          {/* Food & Living */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              Food & Services
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link href="/food" className="hover:text-white transition">
                  Daily Tiffin & Mess Menus
                </Link>
              </li>
              <li>
                <Link href="/food?type=monthly" className="hover:text-white transition">
                  Monthly Meal Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/student" className="hover:text-white transition">
                  Vacation Meal Pause Guarantee
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-white transition">
                  List Your Property (Owner KYC)
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & API */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              System & Transparency
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <a
                  href="http://localhost:4000/api/v1/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition"
                >
                  Swagger OpenAPI 3.0 Docs
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:4000/api/v1/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition"
                >
                  System Health Check
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition">
                  Platform Admin Console
                </Link>
              </li>
              <li>
                <span className="text-emerald-400/80">Redis 15-min Bed Hold Engine Active</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Apna Ghar Inc. All rights reserved. Built for Indian students.
          </div>
          <div className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for university living
          </div>
        </div>
      </div>
    </footer>
  );
};
