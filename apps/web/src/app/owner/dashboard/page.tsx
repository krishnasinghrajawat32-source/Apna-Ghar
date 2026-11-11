'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Clock,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { UserRole } from '@apna-ghar/shared-types';

interface OwnerOverview {
  totalProperties: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  heldBeds: number;
  occupancyRate: number;
}

interface OwnerProperty {
  id: string;
  name: string;
  slug: string;
  propertyType: string;
  address: {
    street: string;
    city: string;
  };
  totalBeds: number;
  availableBeds: number;
  trustPassport?: {
    overallScore: number;
    verified: boolean;
  };
}

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();

  const { data: overview, isLoading: isOverviewLoading } = useQuery<OwnerOverview>({
    queryKey: ['owner-overview'],
    queryFn: () => apiClient<OwnerOverview>('/owner/overview'),
    enabled: !!user,
  });

  const { data: properties = [], isLoading: isPropertiesLoading } = useQuery<OwnerProperty[]>({
    queryKey: ['owner-properties'],
    queryFn: () => apiClient<OwnerProperty[]>('/owner/properties'),
    enabled: !!user,
  });

  return (
    <AuthGuard allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
      <div className="min-h-screen bg-[#FAF8F3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center text-2xl font-black shadow-md">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                    Owner Portal — {user?.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAEBDE] text-[#E06D3B] border border-[#E06D3B]/20">
                    Property Owner
                  </span>
                </div>
                <p className="text-xs text-[#687586] mt-1">
                  Manage your student accommodation listings, room inventory, and occupancy metrics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] hover:bg-[#E8E5DE] border border-[#E8E5DE] transition"
              >
                <Eye className="w-4 h-4" />
                View Marketplace
              </Link>
            </div>
          </div>

          {/* Portfolio Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Properties Listed</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : overview?.totalProperties ?? properties.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Total Beds</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : overview?.totalBeds ?? 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Available Beds</span>
              <p className="text-2xl font-black text-[#21865B] mt-1">
                {isOverviewLoading ? '—' : overview?.availableBeds ?? 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Occupancy Rate</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : `${overview?.occupancyRate ?? 0}%`}
              </p>
            </div>
          </div>

          {/* Properties Inventory List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#102B50] tracking-tight">
                  Managed Properties
                </h2>
                <p className="text-xs text-[#687586]">
                  Live bed inventory, audit scores, and room allocations.
                </p>
              </div>
            </div>

            {isPropertiesLoading ? (
              <div className="py-12 text-center text-xs text-[#687586] flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" /> Loading managed listings...
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#102B50]">{prop.name}</h3>
                        <p className="text-[11px] text-[#687586] mt-0.5">
                          {prop.address?.street}, {prop.address?.city}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#102B50]/10 text-[#102B50]">
                        {prop.propertyType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E8E5DE]">
                      <span className="text-[#687586]">
                        Available: <strong className="text-[#21865B]">{prop.availableBeds}</strong> / {prop.totalBeds} beds
                      </span>
                      <Link
                        href={`/property/${prop.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#F5A623] hover:text-[#E99A12]"
                      >
                        Public Listing
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center space-y-3">
                <Building2 className="w-10 h-10 text-[#687586] mx-auto opacity-40" />
                <p className="text-xs text-[#687586]">
                  You have not listed any properties under this owner account yet.
                </p>
                <p className="text-[11px] text-[#687586]">
                  Contact Apna Ghar onboarding team to verify and list your hostel or PG.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
