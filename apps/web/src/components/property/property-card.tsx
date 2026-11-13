'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, MapPin, Bed, Snowflake, Utensils, Clock, Heart, Scale, ArrowRight } from 'lucide-react';
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
        return { label: 'Fresh Availability', color: 'text-[#21865B] bg-[#21865B]/10 border-[#21865B]/25' };
      case AvailabilityFreshness.NEEDS_CONFIRMATION:
        return { label: 'Verification Recommended', color: 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30' };
      case AvailabilityFreshness.STALE:
        return { label: 'Check Availability', color: 'text-[#687586] bg-[#E8E5DE]/50 border-[#E8E5DE]' };
    }
  };

  const freshnessMeta = getFreshnessLabel(property.freshness);

  return (
    <div className="bg-white rounded-3xl border border-[#E8E5DE] shadow-brand-sm hover:shadow-brand-card-hover transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Property Image & Overlays */}
      <div className="relative aspect-[16/10] w-full bg-[#E8E5DE] overflow-hidden">
        <Image
          src={thumbnail!}
          alt={property.name}
          fill
          unoptimized
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {property.isFullyVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#102B50] text-white shadow-md pointer-events-auto border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623]" />
              Trust Passport Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#263445]/80 text-white backdrop-blur-sm pointer-events-auto">
              Verification In Review
            </span>
          )}

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              title="Add to Compare"
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-[#102B50] hover:text-[#F5A623] hover:bg-white flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <Scale className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Save to Favorites"
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-[#102B50] hover:text-[#D64545] hover:bg-white flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Property Type Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-[#102B50]/90 text-white backdrop-blur-md border border-white/15">
            {property.propertyType} • {property.genderPreference}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="space-y-1">
            <Link href={`/property/${property.slug}`}>
              <h3 className="text-base font-extrabold text-[#102B50] group-hover:text-[#F5A623] transition-colors leading-snug line-clamp-1">
                {property.name}
              </h3>
            </Link>

            {/* Proximity / Distance */}
            <div className="flex items-center gap-1.5 text-xs text-[#263445]">
              <MapPin className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
              <span className="font-bold text-[#102B50]">
                {property.distanceMeters !== undefined ? formatDistance(property.distanceMeters) : property.address.street}
              </span>
              {collegeAnchor && (
                <span className="text-[#687586] truncate">
                  from {collegeAnchor}
                </span>
              )}
            </div>
          </div>

          {/* Key Amenities Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-[#263445]">
            {property.hasAc && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#102B50]/10 text-[#102B50]">
                <Snowflake className="w-3 h-3 text-[#102B50]" />
                AC
              </span>
            )}
            {property.hasFood && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5A623]/15 text-[#102B50]">
                <Utensils className="w-3 h-3 text-[#F5A623]" />
                Food Inc.
              </span>
            )}
            {property.sharingTypes.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-lg bg-[#FAF8F3] border border-[#E8E5DE] text-[#687586]">
                {s.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Footer: Rent & Real Bed Availability */}
        <div className="pt-3.5 border-t border-[#E8E5DE] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#687586] font-semibold block">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-[#102B50]">
                {formatCurrency(property.startingRent)}
              </span>
              <span className="text-[11px] text-[#687586] font-semibold">/mo</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#102B50]">
              <Bed className="w-3.5 h-3.5 text-[#F5A623]" />
              {property.availableBedsCount} {property.availableBedsCount === 1 ? 'Bed' : 'Beds'} Available
            </span>
            <div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${freshnessMeta.color} inline-flex items-center gap-1`}>
              <Clock className="w-2.5 h-2.5" />
              {freshnessMeta.label}
            </div>
          </div>
        </div>

        {/* Quick View Button */}
        <Link
          href={`/property/${property.slug}`}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] hover:bg-[#F5A623] hover:text-[#102B50] border border-[#E8E5DE] hover:border-[#F5A623] transition-all flex items-center justify-center gap-1.5"
        >
          <span>View Rooms & Real Beds</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
