'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatINR, formatDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Star,
  Check,
  ShieldCheck,
  Building,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface College {
  id: string;
  name: string;
  slug: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface PropertySearchResult {
  id: string;
  name: string;
  slug: string;
  propertyType: string;
  genderPreference: string;
  furnishingStatus: string;
  addressStreet: string;
  city: string;
  state: string;
  isVerified: boolean;
  averageRating: number;
  reviewCount: number;
  distanceMeters?: number;
  minRent?: number;
  maxRent?: number;
  coverImage?: string;
  amenities?: Array<{ name: string; icon?: string }>;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query params
  const initialCollege = searchParams.get('college') || '';
  const initialRadius = searchParams.get('radius') || '5';
  const initialQuery = searchParams.get('q') || '';
  const initialGender = searchParams.get('gender') || 'ANY';

  // State
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>(initialCollege);
  const [radiusKm, setRadiusKm] = useState<string>(initialRadius);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [genderFilter, setGenderFilter] = useState<string>(initialGender);
  const [maxBudget, setMaxBudget] = useState<number>(25000);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [hasAc, setHasAc] = useState<boolean>(false);

  const [properties, setProperties] = useState<PropertySearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [comparedProperties, setComparedProperties] = useState<string[]>([]);

  // Load college directory
  useEffect(() => {
    async function loadColleges() {
      try {
        const data = await apiClient.get<College[]>('/colleges');
        setColleges(data || []);
      } catch {
        // Fallback default colleges if DB empty
        setColleges([
          { id: '1', name: 'IIT Delhi', slug: 'iit-delhi', city: 'New Delhi', latitude: 28.545, longitude: 77.1926 },
          { id: '2', name: 'DU North Campus', slug: 'du-north-campus', city: 'Delhi', latitude: 28.692, longitude: 77.214 },
          { id: '3', name: 'BITS Pilani', slug: 'bits-pilani', city: 'Pilani', latitude: 28.3639, longitude: 75.587 },
          { id: '4', name: 'IIT Bombay', slug: 'iit-bombay', city: 'Mumbai', latitude: 19.1334, longitude: 72.9133 },
        ]);
      }
    }
    loadColleges();
  }, []);

  // Fetch properties based on filters
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        // If a college is selected, use geospatial proximity search
        const collegeObj = colleges.find((c) => c.slug === selectedCollege);
        let endpoint = '/properties';

        if (collegeObj && collegeObj.latitude && collegeObj.longitude) {
          endpoint = `/search/nearby?lat=${collegeObj.latitude}&lng=${collegeObj.longitude}&radiusKm=${radiusKm}`;
        } else {
          endpoint = `/properties?limit=20`;
        }

        const data = await apiClient.get<any>(endpoint);
        let results: PropertySearchResult[] = Array.isArray(data) ? data : data?.items || [];

        // Apply client-side filters if not filtered on backend
        if (genderFilter !== 'ANY') {
          results = results.filter(
            (p) => p.genderPreference === genderFilter || p.genderPreference === 'CO_ED' || p.genderPreference === 'ANY',
          );
        }
        if (onlyVerified) {
          results = results.filter((p) => p.isVerified);
        }
        if (maxBudget) {
          results = results.filter((p) => !p.minRent || p.minRent <= maxBudget);
        }

        setProperties(results);
      } catch {
        // Fallback sample data if backend empty
        setProperties([
          {
            id: 'sample-prop-1',
            name: 'Green Villa Residency PG',
            slug: 'green-villa-residency',
            propertyType: 'PG',
            genderPreference: 'MALE_ONLY',
            furnishingStatus: 'FULLY_FURNISHED',
            addressStreet: '12-A, Kalu Sarai, Near Hauz Khas Metro',
            city: 'New Delhi',
            state: 'Delhi',
            isVerified: true,
            averageRating: 4.8,
            reviewCount: 24,
            distanceMeters: 650,
            minRent: 8500,
            maxRent: 14000,
            coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80',
            amenities: [{ name: 'High-Speed Wi-Fi' }, { name: 'Air Conditioning' }, { name: 'Biometric Access' }],
          },
          {
            id: 'sample-prop-2',
            name: 'Shree Krishna Girls Hostel',
            slug: 'shree-krishna-girls-hostel',
            propertyType: 'HOSTEL',
            genderPreference: 'FEMALE_ONLY',
            furnishingStatus: 'FULLY_FURNISHED',
            addressStreet: '44, Vijay Nagar, North Campus',
            city: 'Delhi',
            state: 'Delhi',
            isVerified: true,
            averageRating: 4.9,
            reviewCount: 38,
            distanceMeters: 420,
            minRent: 9500,
            maxRent: 16000,
            coverImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
            amenities: [{ name: '24/7 CCTV Security' }, { name: 'Full Meal Mess' }, { name: 'Attached Bath' }],
          },
          {
            id: 'sample-prop-3',
            name: 'Apex Scholars Co-Living',
            slug: 'apex-scholars-coliving',
            propertyType: 'PG',
            genderPreference: 'CO_ED',
            furnishingStatus: 'FULLY_FURNISHED',
            addressStreet: '88, Powai Main Road, Opp IIT Gate',
            city: 'Mumbai',
            state: 'Maharashtra',
            isVerified: true,
            averageRating: 4.7,
            reviewCount: 19,
            distanceMeters: 800,
            minRent: 12000,
            maxRent: 22000,
            coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80',
            amenities: [{ name: 'Study Lounge' }, { name: 'Power Backup' }, { name: 'Gym & TT Room' }],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [selectedCollege, radiusKm, genderFilter, onlyVerified, maxBudget, colleges]);

  const toggleCompare = (id: string) => {
    if (comparedProperties.includes(id)) {
      setComparedProperties(comparedProperties.filter((pId) => pId !== id));
    } else {
      if (comparedProperties.length >= 4) {
        alert('You can compare a maximum of 4 properties side by side.');
        return;
      }
      setComparedProperties([...comparedProperties, id]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* College Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">University / Campus</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="">All Campuses / Cities</option>
              {colleges.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Radius Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Distance Radius</label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="1">Within 1 km (Walking)</option>
              <option value="3">Within 3 km (Cycle / Auto)</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
            </select>
          </div>

          {/* Gender Preference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Gender Preference</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="ANY">Any / All Gender</option>
              <option value="MALE_ONLY">Boys Only</option>
              <option value="FEMALE_ONLY">Girls Only</option>
              <option value="CO_ED">Co-Ed</option>
            </select>
          </div>

          {/* Max Budget Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Max Budget</span>
              <span className="font-mono text-emerald-400 font-bold">{formatINR(maxBudget)}/mo</span>
            </div>
            <input
              type="range"
              min="4000"
              max="35000"
              step="1000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
            />
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-brand-500"
              />
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Stays Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={hasAc}
                onChange={(e) => setHasAc(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-brand-500"
              />
              <span>Air Conditioned</span>
            </label>
          </div>

          {/* Comparison Bar Trigger */}
          {comparedProperties.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                {comparedProperties.length} of 4 selected
              </span>
              <Button
                size="sm"
                variant="emerald"
                onClick={() =>
                  router.push(`/compare?ids=${comparedProperties.join(',')}`)
                }
                className="text-xs py-1"
              >
                <Layers className="w-3.5 h-3.5 mr-1" />
                Compare Now ({comparedProperties.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Verified Student Accommodations</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {properties.length} Results
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedCollege
              ? `Proximity radius of ${radiusKm}km from ${colleges.find((c) => c.slug === selectedCollege)?.name || selectedCollege}`
              : 'Showing all student PGs, hostels, and shared flats'}
          </p>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No properties found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try expanding your distance radius or adjusting budget filters to see more student accommodations.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCollege('');
              setMaxBudget(35000);
              setGenderFilter('ANY');
              setOnlyVerified(false);
            }}
            className="mt-4 text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const isCompared = comparedProperties.includes(prop.id);
            return (
              <Card
                key={prop.id}
                className="overflow-hidden hover:border-slate-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Property Cover Image */}
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={
                        prop.coverImage ||
                        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={prop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Verified & Gender Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {prop.isVerified && <Badge variant="verified" size="sm">Verified</Badge>}
                      <Badge variant="default" size="sm">
                        {prop.genderPreference.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Proximity / Distance Tag */}
                    {prop.distanceMeters !== undefined && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur border border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {formatDistance(prop.distanceMeters)} to Campus
                      </div>
                    )}

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{prop.averageRating?.toFixed(1) || '4.8'}</span>
                      <span className="text-slate-400 text-[10px]">({prop.reviewCount || 12})</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">
                        {prop.propertyType}
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition mt-0.5">
                        {prop.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {prop.addressStreet}, {prop.city}
                      </p>
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(prop.amenities || [
                        { name: 'Wi-Fi' },
                        { name: 'AC' },
                        { name: 'Mess' },
                      ])
                        .slice(0, 3)
                        .map((a, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px] border border-slate-700/60"
                          >
                            {a.name}
                          </span>
                        ))}
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer: Price & CTA */}
                <div className="p-5 pt-0 border-t border-slate-800/80 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Starts At</span>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono">
                      {formatINR(prop.minRent || 8000)}
                      <span className="text-xs text-slate-400 font-sans font-normal"> /mo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compare Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => toggleCompare(prop.id)}
                      className={`p-2 rounded-xl border text-xs transition ${
                        isCompared
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title="Compare side-by-side"
                    >
                      <Layers className="w-4 h-4" />
                    </button>

                    <Link href={`/properties/${prop.id}`}>
                      <Button variant="emerald" size="sm" className="text-xs py-1.5 px-3">
                        View Beds
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
          Loading student accommodations...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
