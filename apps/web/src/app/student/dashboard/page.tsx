'use client';

import React from 'react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { UserRole } from '@apna-ghar/shared-types';
import { GraduationCap, ShieldCheck, Calendar, Home } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  return (
    <AuthGuard allowedRoles={[UserRole.STUDENT]}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#DCE8E2] text-[#173327] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#173327] tracking-tight">
                Welcome, {user?.name}
              </h1>
              <p className="text-xs text-[#3D3A33]">
                Student Living Portal • Account ID: {user?.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCE8E2] text-[#173327]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Student
            </span>
          </div>
        </div>

        {/* Dashboard Grid with Strict Empty States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Bookings Card */}
          <div className="bg-white border border-[#ECE8DD] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[#173327]" />
                <h2 className="text-sm font-bold text-[#173327]">Active Accommodations</h2>
              </div>
              <span className="text-[11px] font-semibold text-[#3D3A33]">0 Active</span>
            </div>

            {/* Strict Empty State - Lock 4 */}
            <div className="p-8 border border-dashed border-[#DDD7C7] rounded-lg text-center space-y-2 bg-[#FCFBF7]">
              <p className="text-xs font-semibold text-[#173327]">
                No accommodation booked yet.
              </p>
              <p className="text-[11px] text-[#3D3A33] max-w-sm mx-auto">
                Discover verified student accommodation near your campus with Trust Passport and transparent living cost breakdown.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors"
                >
                  Explore Properties
                </Link>
              </div>
            </div>
          </div>

          {/* Scheduled Visits Card */}
          <div className="bg-white border border-[#ECE8DD] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#173327]" />
                <h2 className="text-sm font-bold text-[#173327]">Scheduled Property Visits</h2>
              </div>
              <span className="text-[11px] font-semibold text-[#3D3A33]">0 Scheduled</span>
            </div>

            {/* Strict Empty State - Lock 4 */}
            <div className="p-8 border border-dashed border-[#DDD7C7] rounded-lg text-center space-y-2 bg-[#FCFBF7]">
              <p className="text-xs font-semibold text-[#173327]">
                No property visits scheduled yet.
              </p>
              <p className="text-[11px] text-[#3D3A33] max-w-sm mx-auto">
                Schedule in-person visits to inspect facilities, meet property wardens, and check room inventory before reserving.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
