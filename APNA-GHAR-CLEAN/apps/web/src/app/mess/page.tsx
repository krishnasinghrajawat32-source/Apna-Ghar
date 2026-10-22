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
      <div className="bg-gradient-to-br from-[#173327] to-[#1F4333] text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FSSAI Certified Student Dining Network</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Healthy, Homestyle Messes Near Your Campus
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Browse verified student messes, transparent rotating weekly menus, and pure dietary options. Subscribe to monthly meal plans with digital QR meal passes.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>Filters:</span>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-1 bg-[#FCFBF7] border border-[#ECE8DD] rounded-xl p-1 text-xs font-semibold">
            {['Kota', 'Delhi', 'ALL'].map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-3 py-1 rounded-lg transition ${
                  cityFilter === city
                    ? 'bg-[#173327] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {city === 'ALL' ? 'All Cities' : city}
              </button>
            ))}
          </div>

          {/* Dietary Type Selector */}
          <div className="flex items-center gap-1 bg-[#FCFBF7] border border-[#ECE8DD] rounded-xl p-1 text-xs font-semibold">
            {[
              { id: 'ALL', label: 'All Diets' },
              { id: 'PURE_VEG', label: 'Pure Veg' },
              { id: 'JAIN_AVAILABLE', label: 'Jain Available' },
              { id: 'VEG_AND_NON_VEG', label: 'Veg & Non-Veg' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDietaryFilter(d.id)}
                className={`px-3 py-1 rounded-lg transition ${
                  dietaryFilter === d.id
                    ? 'bg-[#173327] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{messes.length}</span> verified mess outlets
        </div>
      </div>

      {/* Mess Outlets Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Utensils className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading verified campus dining messes...</p>
        </div>
      ) : messes.length === 0 ? (
        <div className="bg-white border border-dashed border-[#DDD7C7] rounded-3xl p-12 text-center space-y-3">
          <Utensils className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">No messes found for this filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching cities or selecting &quot;All Diets&quot; to discover available campus meal partners.
          </p>
          <button
            onClick={() => {
              setCityFilter('ALL');
              setDietaryFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
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
                ? { label: '100% Pure Veg', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                : mess.dietaryType === 'JAIN_AVAILABLE'
                ? { label: 'Satvik / Jain Options', bg: 'bg-amber-50 text-amber-800 border-amber-200' }
                : { label: 'Veg & Non-Veg', bg: 'bg-blue-50 text-blue-800 border-blue-200' };

            return (
              <div
                key={mess.id}
                className="bg-white border border-[#ECE8DD] rounded-3xl p-6 shadow-sm hover:border-[#173327]/40 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${dietaryBadge.bg}`}
                    >
                      {dietaryBadge.label}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{mess.rating}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-[#173327] hover:underline">
                      <Link href={`/mess/${mess.slug}`}>{mess.name}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {mess.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-[#ECE8DD]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{mess.address.street}, {mess.address.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Lunch: {mess.operatingHours.lunch} • Dinner: {mess.operatingHours.dinner}</span>
                    </div>
                    {mess.hygieneCertified && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>FSSAI Lic. #{mess.fssaiNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Pricing & Action */}
                <div className="pt-4 border-t border-[#ECE8DD] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                      Starting from
                    </span>
                    <span className="text-base font-black text-[#173327]">
                      {formatCurrency(minMonthlyPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500"> / month</span>
                  </div>

                  <Link
                    href={`/mess/${mess.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition shadow-xs"
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
