'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { UserRole } from '@apna-ghar/shared-types';

interface AdminOverview {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  pendingReviews: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  const { data: overview, isLoading } = useQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient<AdminOverview>('/admin/overview'),
    enabled: !!user,
  });

  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-[#FAF8F3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center text-2xl font-black shadow-md">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                    Admin Command Center
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#102B50]/10 text-[#102B50]">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-[#687586] mt-1">
                  Manage trust passports, audit verifications, review moderations, and platform metrics.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Registered Users</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isLoading ? '—' : overview?.totalUsers ?? 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Active Properties</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isLoading ? '—' : overview?.totalProperties ?? 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Total Bookings</span>
              <p className="text-2xl font-black text-[#21865B] mt-1">
                {isLoading ? '—' : overview?.totalBookings ?? 0}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Pending Audits</span>
              <p className="text-2xl font-black text-[#E06D3B] mt-1">
                {isLoading ? '—' : overview?.pendingReviews ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
