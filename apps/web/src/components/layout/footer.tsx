'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Heart, Utensils, Home, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#102B50] text-white border-t border-[#183D68] mt-auto">
      {/* Trust Highlights Bar */}
      <div className="border-b border-white/10 bg-[#0C203C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">7-Point Verified</p>
                <p className="text-[11px] text-white/60">Trust Passport audited</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#21865B]/20 flex items-center justify-center text-[#21865B]">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Exact Bed Selection</p>
                <p className="text-[11px] text-white/60">Live real-time inventory</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">0 Hidden Brokerage</p>
                <p className="text-[11px] text-white/60">Direct owner pricing</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623]/20 flex items-center justify-center text-[#F5A623]">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Verified Mess Plans</p>
                <p className="text-[11px] text-white/60">Daily rotating menus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#F5A623] flex items-center justify-center text-[#102B50] font-black text-xl shadow-md transition-transform group-hover:scale-105">
                AG
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-tight">
                  APNA GHAR
                </span>
                <span className="text-xs text-[#F5A623] font-bold tracking-wide uppercase">
                  Har Sahar Apna Ghar
                </span>
              </div>
            </Link>
            <p className="text-xs text-white/75 leading-relaxed max-w-sm">
              India's premier student living ecosystem. We bridge university students with verified PGs, hostels, flats, and hygienic mess services across premier university hubs.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/60 pt-2">
              <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Noida • Delhi NCR • Pilani • Gurgaon</span>
            </div>
          </div>

          {/* Quick Discover */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
              Discover
            </p>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Find Student Stays
                </Link>
              </li>
              <li>
                <Link href="/mess" className="hover:text-white transition-colors">
                  Monthly Mess Plans
                </Link>
              </li>
              <li>
                <Link href="/search?gender=GIRLS" className="hover:text-white transition-colors">
                  Girls-Only Hostels
                </Link>
              </li>
              <li>
                <Link href="/search?gender=BOYS" className="hover:text-white transition-colors">
                  Boys PGs & Stays
                </Link>
              </li>
              <li>
                <Link href="/search?gender=COED" className="hover:text-white transition-colors">
                  Co-Living Residencies
                </Link>
              </li>
            </ul>
          </div>

          {/* For Students */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
              Students & Owners
            </p>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/student/bookings" className="hover:text-white transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/student/visits" className="hover:text-white transition-colors">
                  Scheduled Visits
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Property Owner Login
                </Link>
              </li>
              <li>
                <Link href="/register?role=OWNER" className="hover:text-white transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link href="/register?role=MESS_PARTNER" className="hover:text-white transition-colors">
                  Partner with Mess
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F5A623]">
              Trust & Support
            </p>
            <ul className="space-y-2 text-xs text-white/70">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#21865B]" />
                <span>Physical Audits</span>
              </li>
              <li>
                <span className="text-white/50">Zero Hidden Brokerage</span>
              </li>
              <li>
                <span className="text-white/50">Refundable Bed Holds</span>
              </li>
              <li>
                <span className="text-white/50">Emergency Student Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <p>© {new Date().getFullYear()} Apna Ghar Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />
            <span>for university students across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
