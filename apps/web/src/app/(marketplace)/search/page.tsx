'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal,
  MapPin,
  RotateCcw,
  Building2,
  Search,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PropertyCard, PropertyCardProps } from '@/components/property/property-card';
import { GenderPreference, SharingType, PropertyType } from '@apna-ghar/shared-types';

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
  const cityParam = searchParams.get('city') || '';
  const collegeParam = searchParams.get('college') || '';
  const qParam = searchParams.get('q') || '';
  const propertyTypeParam = searchParams.get('propertyType') || '';
  const genderParam = searchParams.get('gender') || '';
  const sharingParam = searchParams.get('sharing') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const acParam = searchParams.get('ac') === 'true';
  const foodParam = searchParams.get('food') === 'true';
  const verifiedOnlyParam = searchParams.get('verifiedOnly') === 'true';
  const sortParam = searchParams.get('sort') || 'recommended';

  // Search input state
  const [searchInput, setSearchInput] = useState(qParam || cityParam || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchInput(qParam || cityParam || '');
  }, [qParam, cityParam]);

  // Sync filters to URL
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'false') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // When explicitly setting city, clear college so city search takes precedence
    if (key === 'city' && value) {
      params.delete('college');
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (cityParam) params.set('city', cityParam);
    else if (collegeParam) params.set('college', collegeParam);
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = searchInput.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (!val) {
      params.delete('q');
      params.delete('city');
    } else {
      const lower = val.toLowerCase();
      if (['bhopal', 'indore', 'gwalior'].includes(lower)) {
        params.set('city', val.charAt(0).toUpperCase() + val.slice(1).toLowerCase());
        params.delete('q');
        params.delete('college');
      } else {
        params.set('q', val);
      }
    }
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  // TanStack Query for authoritative server state
  const { data, isLoading, isError } = useQuery<SearchResponse>({
    queryKey: ['properties-search', searchParams.toString()],
    queryFn: () => apiClient<SearchResponse>(`/properties?${searchParams.toString()}`),
  });

  const properties = Array.isArray(data) ? data : data?.data || [];
  const total = (data as any)?.meta?.total ?? properties.length;
  const activeLocation =
    (data as any)?.meta?.collegeAnchor ||
    cityParam ||
    (collegeParam ? collegeParam.replace(/-/g, ' ') : '') ||
    'Madhya Pradesh';

  const CITIES = [
    { label: 'All MP', value: '' },
    { label: 'Bhopal', value: 'Bhopal' },
    { label: 'Indore', value: 'Indore' },
    { label: 'Gwalior', value: 'Gwalior' },
  ];

  const PROPERTY_TYPES = [
    { label: 'All Stays', value: '' },
    { label: 'Hostels', value: PropertyType.HOSTEL },
    { label: 'PGs', value: PropertyType.PG },
    { label: 'Student Flats', value: PropertyType.STUDENT_FLAT },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Bar & City Selector Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E5DE] shadow-brand-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-[#102B50] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by city (Bhopal, Indore, Gwalior), college or stay name..."
              className="w-full pl-12 pr-4 py-3.5 text-xs sm:text-sm rounded-2xl border border-[#E8E5DE] focus:outline-none focus:ring-2 focus:ring-[#F5A623] bg-[#FAF8F3] text-[#263445] font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-colors shadow-xs shrink-0"
          >
            Search Stays
          </button>
        </form>

        {/* Quick City Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E5DE]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#687586] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
              City:
            </span>
            {CITIES.map((c) => {
              const isActive = (cityParam.toLowerCase() === c.value.toLowerCase()) || (!cityParam && !c.value);
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => updateFilter('city', c.value || null)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#102B50] text-[#F5A623] shadow-xs'
                      : 'bg-[#FAF8F3] text-[#263445] hover:bg-white border border-[#E8E5DE]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Quick Property Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#687586]">Type:</span>
            {PROPERTY_TYPES.map((t) => {
              const isActive = (propertyTypeParam === t.value) || (!propertyTypeParam && !t.value);
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => updateFilter('propertyType', t.value || null)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#F5A623] text-[#102B50] shadow-xs'
                      : 'bg-[#FAF8F3] text-[#263445] hover:bg-white border border-[#E8E5DE]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E8E5DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F5A623]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="capitalize">{activeLocation}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#102B50] tracking-tight">
            Verified Accommodations in {activeLocation}
          </h1>
          <p className="text-xs text-[#687586]">
            {isLoading ? 'Scanning city inventory...' : `${total} verified ${total === 1 ? 'stay' : 'stays'} available in ${activeLocation}`}
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

          {/* City Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102B50] block">
              City
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => updateFilter('city', c.value || null)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    (cityParam.toLowerCase() === c.value.toLowerCase()) || (!cityParam && !c.value)
                      ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                      : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:bg-white hover:border-[#F5A623]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accommodation Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102B50] block">
              Accommodation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => updateFilter('propertyType', t.value || null)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    (propertyTypeParam === t.value) || (!propertyTypeParam && !t.value)
                      ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                      : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:bg-white hover:border-[#F5A623]'
                  }`}
                >
                  {t.label}
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
              <option value="6000">Up to ₹6,000 / mo</option>
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
                  No verified accommodations found in {activeLocation}
                </h3>
                <p className="text-xs text-[#687586] leading-relaxed">
                  We could not find any active student properties matching your exact filters in {activeLocation}. Try selecting another city (Bhopal, Indore, Gwalior) or resetting filters.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => updateFilter('city', 'Bhopal')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition-colors shadow-sm"
                >
                  View Bhopal Stays
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
                  collegeAnchor={activeLocation}
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
            <p className="text-xs text-[#263445] font-semibold">Loading verified accommodations...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
