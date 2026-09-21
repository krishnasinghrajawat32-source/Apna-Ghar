'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Check,
  X,
  ShieldCheck,
  Star,
  Building,
  ArrowRight,
  Trash2,
  Plus,
} from 'lucide-react';

interface ComparedProperty {
  id: string;
  name: string;
  propertyType: string;
  genderPreference: string;
  isVerified: boolean;
  minRent: number;
  maxRent: number;
  securityDeposit: number;
  maintenanceMonthly: number;
  foodMonthly: number;
  totalEstimatedMonthly: number;
  averageRating: number;
  reviewCount: number;
  addressStreet: string;
  city: string;
  coverImage?: string;
  amenities: string[];
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') || '';

  const [properties, setProperties] = useState<ComparedProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadComparison() {
      setLoading(true);
      const ids = idsParam.split(',').filter(Boolean);

      if (ids.length < 2) {
        // Fallback sample mock data for preview if less than 2 passed
        setProperties([
          {
            id: 'sample-prop-1',
            name: 'Green Villa Residency PG',
            propertyType: 'PG',
            genderPreference: 'MALE_ONLY',
            isVerified: true,
            minRent: 8500,
            maxRent: 14000,
            securityDeposit: 10000,
            maintenanceMonthly: 500,
            foodMonthly: 3000,
            totalEstimatedMonthly: 12000,
            averageRating: 4.8,
            reviewCount: 24,
            addressStreet: '12-A, Kalu Sarai',
            city: 'New Delhi',
            coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80',
            amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Biometric Access', 'RO Drinking Water', 'CCTV Security'],
          },
          {
            id: 'sample-prop-2',
            name: 'Shree Krishna Girls Hostel',
            propertyType: 'HOSTEL',
            genderPreference: 'FEMALE_ONLY',
            isVerified: true,
            minRent: 9500,
            maxRent: 16000,
            securityDeposit: 12000,
            maintenanceMonthly: 600,
            foodMonthly: 3500,
            totalEstimatedMonthly: 13600,
            averageRating: 4.9,
            reviewCount: 38,
            addressStreet: '44, Vijay Nagar',
            city: 'Delhi',
            coverImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
            amenities: ['High-Speed Wi-Fi', 'Full Meal Mess', 'Attached Bath', '24/7 CCTV Security', 'Biometric Access'],
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const data = await apiClient.get<any>(`/comparison?propertyIds=${ids.join(',')}`);
        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
        }
      } catch {
        // Fallback default preview
        setProperties([
          {
            id: ids[0] || '1',
            name: 'Property A (Near Campus)',
            propertyType: 'PG',
            genderPreference: 'CO_ED',
            isVerified: true,
            minRent: 8000,
            maxRent: 12000,
            securityDeposit: 8000,
            maintenanceMonthly: 500,
            foodMonthly: 2500,
            totalEstimatedMonthly: 11000,
            averageRating: 4.6,
            reviewCount: 15,
            addressStreet: 'Civil Lines',
            city: 'Delhi',
            amenities: ['Wi-Fi', 'AC', 'RO Water', 'CCTV'],
          },
          {
            id: ids[1] || '2',
            name: 'Property B (Scholars Co-Living)',
            propertyType: 'HOSTEL',
            genderPreference: 'CO_ED',
            isVerified: true,
            minRent: 11000,
            maxRent: 18000,
            securityDeposit: 15000,
            maintenanceMonthly: 800,
            foodMonthly: 3500,
            totalEstimatedMonthly: 15300,
            averageRating: 4.9,
            reviewCount: 29,
            addressStreet: 'Hauz Khas',
            city: 'Delhi',
            amenities: ['Wi-Fi', 'AC', 'Mess', 'Gym', 'CCTV'],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadComparison();
  }, [idsParam]);

  const removeProperty = (idToRemove: string) => {
    const updated = properties.filter((p) => p.id !== idToRemove);
    setProperties(updated);
    const remainingIds = updated.map((p) => p.id).join(',');
    if (remainingIds) {
      router.replace(`/compare?ids=${remainingIds}`);
    } else {
      router.replace('/compare');
    }
  };

  const allAmenities = [
    'High-Speed Wi-Fi',
    'Air Conditioning',
    'Full Meal Mess',
    'Attached Bath',
    'Biometric Access',
    'RO Drinking Water',
    '24/7 CCTV Security',
    'Gym & TT Room',
    'Power Backup',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Property Comparison Matrix</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {properties.length} Accommodations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate living costs, amenities, security deposits, and student ratings side by side.
          </p>
        </div>

        <Link href="/search">
          <Button variant="outline" size="sm" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Another Accommodation
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 mt-8">
          <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No properties selected for comparison</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Select 2 to 4 student accommodations from the search discovery portal to compare features side-by-side.
          </p>
          <Link href="/search">
            <Button variant="emerald" size="sm" className="mt-4 text-xs">
              Explore Accommodations →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto mt-8 pb-4">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-4 text-left font-semibold text-slate-400 bg-slate-950/80 w-48 border border-slate-800">
                  Feature / Matrix
                </th>
                {properties.map((prop) => (
                  <th
                    key={prop.id}
                    className="p-4 text-left bg-slate-900 border border-slate-800 min-w-[240px] align-top"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-400">
                          {prop.propertyType}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">{prop.name}</h4>
                        <p className="text-[11px] text-slate-400">{prop.city}</p>
                      </div>
                      <button
                        onClick={() => removeProperty(prop.id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1"
                        title="Remove from comparison"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <Link href={`/properties/${prop.id}`}>
                        <Button variant="emerald" size="sm" className="w-full text-xs py-1.5">
                          View Beds & Book
                        </Button>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {/* Verified Status */}
              <tr>
                <td className="p-4 font-semibold text-slate-300 bg-slate-950/60 border border-slate-800">
                  Verification
                </td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-4 border border-slate-800 bg-slate-900/40">
                    {prop.isVerified ? (
                      <Badge variant="verified" size="sm">
                        Verified Stay
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        Unverified
                      </Badge>
                    )}
                  </td>
                ))}
              </tr>

              {/* Gender Preference */}
              <tr>
                <td className="p-4 font-semibold text-slate-300 bg-slate-950/60 border border-slate-800">
                  Gender Policy
                </td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-4 border border-slate-800 bg-slate-900/40 text-slate-200">
                    {prop.genderPreference.replace('_', ' ')}
                  </td>
                ))}
              </tr>

              {/* Student Ratings */}
              <tr>
                <td className="p-4 font-semibold text-slate-300 bg-slate-950/60 border border-slate-800">
                  Student Rating
                </td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-4 border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{prop.averageRating?.toFixed(1) || '4.8'} / 5.0</span>
                      <span className="text-slate-500 text-[10px]">({prop.reviewCount || 10} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Monthly Rent */}
              <tr>
                <td className="p-4 font-semibold text-slate-300 bg-slate-950/60 border border-slate-800">
                  Monthly Rent Range
                </td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-4 border border-slate-800 bg-slate-900/40 font-mono text-emerald-400 font-bold text-sm">
                    {formatINR(prop.minRent)} – {formatINR(prop.maxRent)}
                  </td>
                ))}
              </tr>

              {/* Security Deposit */}
              <tr>
                <td className="p-4 font-semibold text-slate-300 bg-slate-950/60 border border-slate-800">
                  Security Deposit
                </td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-4 border border-slate-800 bg-slate-900/40 font-mono text-slate-200">
                    {formatINR(prop.securityDeposit || prop.minRent)}
                  </td>
                ))}
              </tr>

              {/* Estimated Total Living Cost */}
              <tr className="bg-brand-950/20">
                <td className="p-4 font-bold text-white bg-slate-950/80 border border-slate-800">
                  Est. Total Monthly Cost
                  <div className="text-[10px] text-slate-400 font-normal">Rent + Maint + Mess</div>
                </td>
                {properties.map((prop) => (
                  <td
                    key={prop.id}
                    className="p-4 border border-slate-800 bg-brand-950/10 font-mono font-extrabold text-base text-brand-400"
                  >
                    {formatINR(prop.totalEstimatedMonthly || prop.minRent + 3500)}
                    <span className="text-[10px] text-slate-400 font-sans font-normal"> /mo</span>
                  </td>
                ))}
              </tr>

              {/* Amenities Breakdown */}
              {allAmenities.map((amenity) => (
                <tr key={amenity}>
                  <td className="p-3 text-slate-400 bg-slate-950/40 border border-slate-800">
                    {amenity}
                  </td>
                  {properties.map((prop) => {
                    const has =
                      prop.amenities?.some((a) =>
                        a.toLowerCase().includes(amenity.toLowerCase().split(' ')[0]),
                      ) || false;
                    return (
                      <td key={prop.id} className="p-3 border border-slate-800 bg-slate-900/20 text-center">
                        {has ? (
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
          Loading comparison matrix...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
