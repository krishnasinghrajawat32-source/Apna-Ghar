'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal,
  MapPin,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PropertyCard, PropertyCardProps } from '@/components/property/property-card';
import { SEARCH_RADIUS_TIERS } from '@apna-ghar/shared-constants';
import { GenderPreference, SharingType } from '@apna-ghar/shared-types';

interface SearchResponse {
  data: PropertyCardProps['property'][];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    collegeAnchor?: string;
  };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const collegeParam = searchParams.get('college') || 'amity-university-noida';
  const radiusParam = searchParams.get('radius') || '3000';
  const genderParam = searchParams.get('gender') || '';
  const sharingParam = searchParams.get('sharing') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const acParam = searchParams.get('ac') === 'true';
  const foodParam = searchParams.get('food') === 'true';
  const verifiedOnlyParam = searchParams.get('verifiedOnly') === 'true';
  const sortParam = searchParams.get('sort') || 'recommended';

  // Local filter states
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync filters to URL
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'false') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (collegeParam) params.set('college', collegeParam);
    router.push(`/search?${params.toString()}`);
  };

  // TanStack Query for authoritative server state
  const { data, isLoading, isError } = useQuery<SearchResponse>({
    queryKey: ['properties-search', searchParams.toString()],
    queryFn: () => apiClient<SearchResponse>(`/properties?${searchParams.toString()}`),
  });

  const properties = Array.isArray(data) ? data : data?.data || [];
  const total = (data as any)?.meta?.total ?? properties.length;
  const collegeAnchor = (data as any)?.meta?.collegeAnchor || collegeParam.replace(/-/g, ' ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E5DE]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F5A623]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="capitalize">{collegeAnchor}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#102B50] tracking-tight">
            Verified Student Accommodations
          </h1>
          <p className="text-xs text-[#687586]">
            {isLoading ? 'Scanning proximity...' : `${total} verified ${total === 1 ? 'stay' : 'stays'} available near campus`}
          </p>
        </div>

        {/* Sort Controls & Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="sm:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8E5DE] bg-white text-xs font-bold text-[#102B50] shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#F5A623]" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2 border border-[#E8E5DE] rounded-xl shadow-brand-sm">
            <span className="text-xs font-semibold text-[#687586] shrink-0">Sort by:</span>
            <select
              value={sortParam}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-transparent text-xs font-bold text-[#102B50] focus:outline-none cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="nearest">Nearest to Campus</option>
              <option value="lowest_rent">Lowest Rent</option>
              <option value="recently_updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters Desktop */}
        <aside className={`lg:block ${mobileFiltersOpen ? 'block' : 'hidden'} space-y-6 bg-white p-6 rounded-3xl border border-[#E8E5DE] shadow-brand-sm h-fit sticky top-24`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E5DE]">
            <div className="flex items-center gap-2 text-xs font-black text-[#102B50]">
              <SlidersHorizontal className="w-4 h-4 text-[#F5A623]" />
              <span>Filters</span>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-[#F5A623] hover:text-[#E99A12] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Radius Tier */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102B50] block">
              Proximity Radius
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEARCH_RADIUS_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => updateFilter('radius', tier.value.toString())}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    radiusParam === tier.value.toString()
                      ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                      : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:bg-white hover:border-[#F5A623]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102B50] block">
              Gender Preference
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: '' },
                { label: 'Boys', value: GenderPreference.BOYS },
                { label: 'Girls', value: GenderPreference.GIRLS },
                { label: 'Co-ed', value: GenderPreference.CO_ED },
              ].map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => updateFilter('gender', g.value || null)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    genderParam === g.value
                      ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                      : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:bg-white hover:border-[#F5A623]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sharing Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102B50] block">
              Room Sharing
            </label>
            <select
              value={sharingParam}
              onChange={(e) => updateFilter('sharing', e.target.value || null)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            >
              <option value="">Any Sharing</option>
              <option value={SharingType.SINGLE}>Single Occupancy</option>
              <option value={SharingType.DOUBLE}>Twin Sharing</option>
              <option value={SharingType.TRIPLE}>Triple Sharing</option>
              <option value={SharingType.FOUR_PLUS}>Four+ Sharing</option>
            </select>
          </div>

          {/* Max Budget */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102B50] block">
              Max Monthly Budget
            </label>
            <select
              value={maxPriceParam}
              onChange={(e) => updateFilter('maxPrice', e.target.value || null)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            >
              <option value="">Any Budget</option>
              <option value="8000">Up to ₹8,000 / mo</option>
              <option value="12000">Up to ₹12,000 / mo</option>
              <option value="16000">Up to ₹16,000 / mo</option>
              <option value="25000">Up to ₹25,000 / mo</option>
            </select>
          </div>

          {/* Amenities & Verified Toggles */}
          <div className="space-y-3 pt-3.5 border-t border-[#E8E5DE]">
            <label className="text-xs font-bold text-[#102B50] block">
              Key Requirements
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#263445] cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnlyParam}
                onChange={(e) => updateFilter('verifiedOnly', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-[#102B50] focus:ring-[#F5A623]"
              />
              <span className="font-bold text-[#102B50]">Trust Passport Verified Only</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#687586] cursor-pointer">
              <input
                type="checkbox"
                checked={acParam}
                onChange={(e) => updateFilter('ac', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-[#102B50] focus:ring-[#F5A623]"
              />
              <span>Air Conditioned (AC)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#687586] cursor-pointer">
              <input
                type="checkbox"
                checked={foodParam}
                onChange={(e) => updateFilter('food', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-[#102B50] focus:ring-[#F5A623]"
              />
              <span>Food / Meals Included</span>
            </label>
          </div>
        </aside>

        {/* Results Grid / Empty State */}
        <main className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-[#E8E5DE] p-5 space-y-4 animate-pulse">
                  <div className="aspect-[16/10] bg-[#E8E5DE] rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-5 bg-[#E8E5DE] rounded w-3/4" />
                    <div className="h-4 bg-[#E8E5DE] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#D64545]/30 space-y-3">
              <p className="text-sm font-bold text-[#D64545]">Unable to load accommodations</p>
              <p className="text-xs text-[#687586]">Please check your connection and try refreshing.</p>
            </div>
          ) : properties.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-[#E8E5DE] space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DE] flex items-center justify-center mx-auto text-[#102B50]">
                <Building2 className="w-8 h-8 text-[#F5A623]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-extrabold text-[#102B50]">
                  No verified accommodations found within this radius
                </h3>
                <p className="text-xs text-[#687586] leading-relaxed">
                  We could not find any active student properties matching your exact filters near {collegeAnchor}. Try expanding your search radius to 15 km or clearing filters.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => updateFilter('radius', '15000')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition-colors shadow-sm"
                >
                  Expand Radius to 15 km
                </button>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] border border-[#E8E5DE] hover:bg-[#F0F4F8] transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  collegeAnchor={collegeAnchor}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#102B50] border-t-[#F5A623] rounded-full animate-spin" />
            <p className="text-xs text-[#263445] font-semibold">Loading verified campus stays...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
