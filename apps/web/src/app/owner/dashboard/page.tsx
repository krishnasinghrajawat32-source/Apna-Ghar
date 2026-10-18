'use client';

import React from 'react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { UserRole } from '@apna-ghar/shared-types';
import { Building2, Plus, Bed, Users } from 'lucide-react';

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <AuthGuard allowedRoles={[UserRole.OWNER]}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FAEBDE] text-[#E06D3B] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#173327] tracking-tight">
                Owner Portal — {user?.name}
              </h1>
              <p className="text-xs text-[#3D3A33]">
                Manage Properties, Real-Time Inventory & Student Visits
              </p>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FAEBDE] text-[#C85A2A]">
              Property Partner
            </span>
          </div>
        </div>

        {/* Real Metrics Grid - Strict Lock 4 (No Fake Statistics) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-[#ECE8DD] rounded-xl p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-[#3D3A33]">
              <span>Properties Listed</span>
              <Building2 className="w-4 h-4 text-[#173327]" />
            </div>
            <p className="text-2xl font-black text-[#173327]">0</p>
            <p className="text-[10px] text-gray-500">Live on platform</p>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-xl p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-[#3D3A33]">
              <span>Total Beds</span>
              <Bed className="w-4 h-4 text-[#E06D3B]" />
            </div>
            <p className="text-2xl font-black text-[#173327]">0</p>
            <p className="text-[10px] text-gray-500">Inventory tracking</p>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-xl p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-[#3D3A33]">
              <span>Pending Visits</span>
              <Users className="w-4 h-4 text-[#3D3A33]" />
            </div>
            <p className="text-2xl font-black text-[#173327]">0</p>
            <p className="text-[10px] text-gray-500">Awaiting confirmation</p>
          </div>
        </div>

        {/* Empty State - Lock 4 */}
        <div className="bg-white border border-[#ECE8DD] rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FCFBF7] border border-[#ECE8DD] flex items-center justify-center mx-auto text-[#173327]">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-[#173327]">No properties onboarded yet</h2>
          <p className="text-xs text-[#3D3A33] max-w-md mx-auto leading-relaxed">
            Begin the 12-step property onboarding to list your hostel or PG, configure room types, add exact bed inventories, and submit for Trust Passport verification.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
              <Plus className="w-4 h-4" />
              Onboarding Opens in Phase 7
            </span>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
