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

  const properties = data?.data || [];
  const total = data?.meta?.total || 0;
  const collegeAnchor = data?.meta?.collegeAnchor || collegeParam.replace(/-/g, ' ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#ECE8DD]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E06D3B]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="capitalize">{collegeAnchor}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#173327] tracking-tight">
            Verified Student Accommodations
          </h1>
          <p className="text-xs text-[#3D3A33]">
            {isLoading ? 'Scanning proximity...' : `${total} verified ${total === 1 ? 'stay' : 'stays'} found near campus`}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-[#ECE8DD] bg-white text-xs font-bold text-[#173327]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#E06D3B]" />
            Filters
          </button>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-[#ECE8DD] rounded-lg shadow-sm">
            <span className="text-xs font-semibold text-[#3D3A33] shrink-0">Sort by:</span>
            <select
              value={sortParam}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-transparent text-xs font-bold text-[#173327] focus:outline-none cursor-pointer"
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
        <aside className={`lg:block ${mobileFiltersOpen ? 'block' : 'hidden'} space-y-6 bg-white p-5 rounded-2xl border border-[#ECE8DD] shadow-sm h-fit sticky top-24`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#173327]">
              <SlidersHorizontal className="w-4 h-4 text-[#E06D3B]" />
              Filter Stays
            </div>
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-[#E06D3B] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Search Radius Tier */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#173327] block">
              Proximity Radius
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEARCH_RADIUS_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => updateFilter('radius', tier.value.toString())}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                    radiusParam === tier.value.toString()
                      ? 'border-[#173327] bg-[#173327] text-white'
                      : 'border-[#ECE8DD] bg-[#FCFBF7] text-[#3D3A33] hover:bg-gray-100'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#173327] block">
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
                  className={`py-1 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    genderParam === g.value
                      ? 'border-[#173327] bg-[#173327] text-white'
                      : 'border-[#ECE8DD] bg-[#FCFBF7] text-[#3D3A33] hover:bg-gray-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sharing Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#173327] block">
              Room Sharing
            </label>
            <select
              value={sharingParam}
              onChange={(e) => updateFilter('sharing', e.target.value || null)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DDD7C7] bg-[#FCFBF7] focus:outline-none"
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
            <label className="text-xs font-bold text-[#173327] block">
              Max Monthly Budget
            </label>
            <select
              value={maxPriceParam}
              onChange={(e) => updateFilter('maxPrice', e.target.value || null)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DDD7C7] bg-[#FCFBF7] focus:outline-none"
            >
              <option value="">Any Budget</option>
              <option value="8000">Up to ₹8,000 / mo</option>
              <option value="12000">Up to ₹12,000 / mo</option>
              <option value="16000">Up to ₹16,000 / mo</option>
              <option value="25000">Up to ₹25,000 / mo</option>
            </select>
          </div>

          {/* Amenities & Verified Toggles */}
          <div className="space-y-3 pt-3 border-t border-[#ECE8DD]">
            <label className="text-xs font-bold text-[#173327] block">
              Key Requirements
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#3D3A33] cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnlyParam}
                onChange={(e) => updateFilter('verifiedOnly', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-[#173327] focus:ring-[#173327]"
              />
              <span className="font-semibold text-[#173327]">Trust Passport Verified Only</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#3D3A33] cursor-pointer">
              <input
                type="checkbox"
                checked={acParam}
                onChange={(e) => updateFilter('ac', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-[#173327] focus:ring-[#173327]"
              />
              <span>Air Conditioned (AC)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#3D3A33] cursor-pointer">
              <input
                type="checkbox"
                checked={foodParam}
                onChange={(e) => updateFilter('food', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded text-[#173327] focus:ring-[#173327]"
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
                <div key={i} className="bg-white rounded-2xl border border-[#ECE8DD] p-4 space-y-4 animate-pulse">
                  <div className="aspect-[16/10] bg-[#ECE8DD] rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-[#ECE8DD] rounded w-3/4" />
                    <div className="h-3 bg-[#ECE8DD] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-red-200 space-y-3">
              <p className="text-sm font-bold text-red-700">Unable to load accommodations</p>
              <p className="text-xs text-gray-600">Please check your connection and try refreshing.</p>
            </div>
          ) : properties.length === 0 ? (
            /* Strict Lock 4 Empty State */
            <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-[#DDD7C7] space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#FCFBF7] border border-[#ECE8DD] flex items-center justify-center mx-auto text-[#173327]">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#173327]">
                  No verified accommodations found within this radius
                </h3>
                <p className="text-xs text-[#3D3A33] max-w-md mx-auto leading-relaxed">
                  We could not find any active student properties matching your exact filters near {collegeAnchor}. Try expanding your search radius to 5 km or clearing filters.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => updateFilter('radius', '15000')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors"
                >
                  Expand Radius to 15 km
                </button>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#173327] bg-[#ECE8DD] hover:bg-[#DDD7C7] transition-colors"
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
        <div className="min-h-screen flex items-center justify-center bg-[#FCFBF7]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#173327] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#3D3A33] font-medium">Loading verified campus stays...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
