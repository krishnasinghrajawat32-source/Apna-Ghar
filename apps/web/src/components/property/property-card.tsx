'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, MapPin, Bed, Snowflake, Utensils, Clock, Heart, Scale } from 'lucide-react';
import { formatCurrency, formatDistance } from '@/lib/utils';
import { AvailabilityFreshness } from '@apna-ghar/shared-types';

export interface PropertyCardProps {
  property: {
    id: string;
    name: string;
    slug: string;
    propertyType: string;
    address: {
      street: string;
      city: string;
      state: string;
    };
    genderPreference: string;
    furnishing: string;
    isFullyVerified: boolean;
    distanceMeters?: number;
    startingRent: number;
    availableBedsCount: number;
    totalBedsCount: number;
    hasAc: boolean;
    hasFood: boolean;
    sharingTypes: string[];
    images: string[];
    freshness: AvailabilityFreshness;
    lastAvailabilityUpdatedAt: string;
  };
  collegeAnchor?: string | null;
}

export function PropertyCard({ property, collegeAnchor }: PropertyCardProps) {
  const thumbnail = property.images && property.images.length > 0
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';

  const getFreshnessLabel = (freshness: AvailabilityFreshness) => {
    switch (freshness) {
      case AvailabilityFreshness.FRESH:
        return { label: 'Fresh Availability', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case AvailabilityFreshness.NEEDS_CONFIRMATION:
        return { label: 'Verification Recommended', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case AvailabilityFreshness.STALE:
        return { label: 'Check Availability', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const freshnessMeta = getFreshnessLabel(property.freshness);

  return (
    <div className="bg-white rounded-2xl border border-[#ECE8DD] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Property Image & Overlays */}
      <div className="relative aspect-[16/10] w-full bg-[#ECE8DD] overflow-hidden">
        <Image
          src={thumbnail!}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {property.isFullyVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#173327] text-white shadow-sm pointer-events-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E06D3B]" />
              Trust Passport Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-900/70 text-white backdrop-blur-sm pointer-events-auto">
              Verification Pending
            </span>
          )}

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              title="Add to Compare"
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-[#173327] hover:text-[#E06D3B] flex items-center justify-center transition-colors shadow-sm"
            >
              <Scale className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Save to Favorites"
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-[#173327] hover:text-red-600 flex items-center justify-center transition-colors shadow-sm"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Property Type Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#173327]/85 text-white backdrop-blur-sm">
            {property.propertyType} • {property.genderPreference}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <Link href={`/property/${property.slug}`}>
              <h3 className="text-base font-bold text-[#173327] group-hover:text-[#E06D3B] transition-colors leading-snug line-clamp-1">
                {property.name}
              </h3>
            </Link>

            {/* Proximity / Distance */}
            <div className="flex items-center gap-1.5 text-xs text-[#3D3A33]">
              <MapPin className="w-3.5 h-3.5 text-[#E06D3B] shrink-0" />
              <span className="font-semibold text-[#173327]">
                {property.distanceMeters !== undefined ? formatDistance(property.distanceMeters) : property.address.street}
              </span>
              {collegeAnchor && (
                <span className="text-gray-500 truncate">
                  from {collegeAnchor}
                </span>
              )}
            </div>
          </div>

          {/* Key Amenities Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-[#3D3A33]">
            {property.hasAc && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0F5F2] text-[#173327]">
                <Snowflake className="w-3 h-3 text-[#173327]" />
                AC
              </span>
            )}
            {property.hasFood && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAEBDE] text-[#C85A2A]">
                <Utensils className="w-3 h-3 text-[#E06D3B]" />
                Food Inc.
              </span>
            )}
            {property.sharingTypes.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-md bg-[#FCFBF7] border border-[#ECE8DD]">
                {s.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Footer: Rent & Real Bed Availability */}
        <div className="pt-3 border-t border-[#ECE8DD] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-[#173327]">
                {formatCurrency(property.startingRent)}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">/mo</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#173327]">
              <Bed className="w-3.5 h-3.5 text-[#E06D3B]" />
              {property.availableBedsCount} {property.availableBedsCount === 1 ? 'Bed' : 'Beds'} Available
            </span>
            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${freshnessMeta.color} inline-flex items-center gap-1`}>
              <Clock className="w-2.5 h-2.5" />
              {freshnessMeta.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
