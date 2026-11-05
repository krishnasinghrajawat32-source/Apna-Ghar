'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Utensils,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Mess } from '@apna-ghar/shared-types';

export default function MessDiscoveryPage() {
  const [cityFilter, setCityFilter] = useState<string>('Kota');
  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');

  const { data: messes = [], isLoading } = useQuery<Mess[]>({
    queryKey: ['mess-list', cityFilter, dietaryFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (cityFilter && cityFilter !== 'ALL') params.append('city', cityFilter);
      if (dietaryFilter && dietaryFilter !== 'ALL') params.append('dietaryType', dietaryFilter);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return apiClient<Mess[]>(`/mess${queryStr}`);
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#102B50] text-white rounded-3xl p-8 sm:p-12 shadow-brand-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FSSAI Certified Student Dining Network</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Healthy, Homestyle Messes Near Your Campus
          </h1>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            Browse verified student messes, transparent rotating weekly menus, and pure dietary options. Subscribe to monthly meal plans with digital QR meal passes.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E8E5DE] rounded-3xl p-5 shadow-brand-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#102B50]">
            <Filter className="w-4 h-4 text-[#F5A623]" />
            <span>Filters:</span>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E5DE] rounded-2xl p-1 text-xs font-semibold">
            {['Kota', 'Delhi', 'ALL'].map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  cityFilter === city
                    ? 'bg-[#102B50] text-white font-bold shadow-sm'
                    : 'text-[#687586] hover:text-[#102B50]'
                }`}
              >
                {city === 'ALL' ? 'All Cities' : city}
              </button>
            ))}
          </div>

          {/* Dietary Type Selector */}
          <div className="flex items-center gap-1 bg-[#FAF8F3] border border-[#E8E5DE] rounded-2xl p-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Diets' },
              { id: 'PURE_VEG', label: 'Pure Veg' },
              { id: 'JAIN_AVAILABLE', label: 'Jain Available' },
              { id: 'VEG_AND_NON_VEG', label: 'Veg & Non-Veg' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDietaryFilter(d.id)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  dietaryFilter === d.id
                    ? 'bg-[#102B50] text-white font-bold shadow-sm'
                    : 'text-[#687586] hover:text-[#102B50]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#687586] font-semibold">
          Showing <span className="font-black text-[#102B50]">{messes.length}</span> verified mess outlets
        </div>
      </div>

      {/* Mess Outlets Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Utensils className="w-8 h-8 text-[#102B50] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#687586]">Loading verified campus dining messes...</p>
        </div>
      ) : messes.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E8E5DE] rounded-3xl p-16 text-center space-y-4">
          <Utensils className="w-12 h-12 text-[#687586] mx-auto" />
          <h3 className="font-extrabold text-base text-[#102B50]">No messes found for this filter</h3>
          <p className="text-xs text-[#687586] max-w-sm mx-auto">
            Try switching cities or selecting &quot;All Diets&quot; to discover available campus meal partners.
          </p>
          <button
            onClick={() => {
              setCityFilter('ALL');
              setDietaryFilter('ALL');
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messes.map((mess) => {
            const minMonthlyPrice = mess.plans?.length
              ? Math.min(...mess.plans.map((p) => p.monthlyPrice))
              : 2500;

            const dietaryBadge =
              mess.dietaryType === 'PURE_VEG'
                ? { label: '100% Pure Veg', bg: 'bg-[#21865B]/10 text-[#21865B] border-[#21865B]/20' }
                : mess.dietaryType === 'JAIN_AVAILABLE'
                ? { label: 'Satvik / Jain Options', bg: 'bg-[#F5A623]/15 text-[#102B50] border-[#F5A623]/30' }
                : { label: 'Veg & Non-Veg', bg: 'bg-[#102B50]/10 text-[#102B50] border-[#102B50]/20' };

            return (
              <div
                key={mess.id}
                className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm hover:shadow-brand-card-hover transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${dietaryBadge.bg}`}
                    >
                      {dietaryBadge.label}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-black text-[#102B50] bg-[#F5A623]/15 px-2.5 py-0.5 rounded-xl border border-[#F5A623]/30">
                      <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                      <span>{mess.rating}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-[#102B50] hover:text-[#F5A623] transition-colors">
                      <Link href={`/mess/${mess.slug}`}>{mess.name}</Link>
                    </h3>
                    <p className="text-xs text-[#687586] line-clamp-2 mt-1 leading-relaxed">
                      {mess.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 text-xs text-[#263445] pt-3 border-t border-[#E8E5DE]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                      <span className="truncate">{mess.address.street}, {mess.address.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#687586] shrink-0" />
                      <span className="text-[#687586]">Lunch: {mess.operatingHours.lunch} • Dinner: {mess.operatingHours.dinner}</span>
                    </div>
                    {mess.hygieneCertified && (
                      <div className="flex items-center gap-1.5 text-[#21865B] font-bold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#21865B]" />
                        <span>FSSAI Lic. #{mess.fssaiNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Pricing & Action */}
                <div className="pt-4 border-t border-[#E8E5DE] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#687586] block uppercase font-bold tracking-wider">
                      Starting from
                    </span>
                    <span className="text-lg font-black text-[#102B50]">
                      {formatCurrency(minMonthlyPrice)}
                    </span>
                    <span className="text-[10px] text-[#687586] font-semibold"> / month</span>
                  </div>

                  <Link
                    href={`/mess/${mess.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm"
                  >
                    <span>View Menu & Plans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
