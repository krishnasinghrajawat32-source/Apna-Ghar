'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Bed,
  Snowflake,
  Clock,
  Shield,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Property, RoomType, PropertyStatus, TrustPassport } from '@apna-ghar/shared-types';
import { TrustPassportCard } from '@/components/verification/trust-passport-card';
import { TotalLivingCostWidget } from '@/components/pricing/total-living-cost-widget';
import { ScheduleVisitModal } from '@/components/visits/schedule-visit-modal';
import { RoomBedSelector } from '@/components/inventory/room-bed-selector';
import { PropertyReviewsSection } from '@/components/reviews/property-reviews-section';

interface PropertyDetailResponse {
  property: Property;
  roomTypes: RoomType[];
  availableBedCount: number;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data, isLoading, isError } = useQuery<PropertyDetailResponse>({
    queryKey: ['property-detail', slug],
    queryFn: () => apiClient<PropertyDetailResponse>(`/properties/${slug}`),
    enabled: !!slug,
  });

  const propertyId = data?.property?.id;

  const { data: passportRes } = useQuery<{ success: boolean; data: TrustPassport }>({
    queryKey: ['property-trust-passport', propertyId],
    queryFn: () => apiClient<{ success: boolean; data: TrustPassport }>(`/properties/${propertyId}/trust-passport`),
    enabled: !!propertyId,
  });

  const passport = passportRes?.data || null;
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#173327] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#3D3A33] font-medium">Verifying accommodation records...</p>
        </div>
      </div>
    );
  }

  if (isError || !data || !data.property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#FCFBF7]">
        <h2 className="text-xl font-bold text-[#173327]">Property Not Found</h2>
        <p className="text-xs text-[#3D3A33] max-w-md">
          The requested student property does not exist or has been deactivated.
        </p>
        <Link
          href="/search"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327]"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const { property, roomTypes, availableBedCount } = data;
  const primaryImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';

  const lodgingSchema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: property.description,
    image: property.images || [primaryImage],
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address.street,
      addressLocality: property.address.city,
      addressRegion: property.address.state,
      postalCode: property.address.pincode,
      addressCountry: 'IN',
    },
    geo: property.location?.coordinates ? {
      '@type': 'GeoCoordinates',
      longitude: property.location.coordinates[0],
      latitude: property.location.coordinates[1],
    } : undefined,
    amenityFeature: (property.amenities || []).map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    priceRange: roomTypes.length > 0 ? `₹${roomTypes[0]?.baseRent} - ₹${roomTypes[roomTypes.length - 1]?.baseRent}` : undefined,
    aggregateRating: property.rating && property.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: property.rating,
      reviewCount: property.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingSchema) }}
      />
      {/* Top Header */}
      <div className="space-y-3 pb-6 border-b border-[#ECE8DD]">
        <div className="flex flex-wrap items-center gap-2">
          {property.status === PropertyStatus.ACTIVE ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#173327] text-white shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#E06D3B]" />
              Trust Passport Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Verification in Progress
            </span>
          )}

          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#F0F5F2] text-[#173327]">
            {property.propertyType} • {property.genderPreference} • {property.furnishing.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173327] tracking-tight">
              {property.name}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#3D3A33]">
              <MapPin className="w-4 h-4 text-[#E06D3B] shrink-0" />
              <span>
                {property.address.street}, {property.address.city}, {property.address.state} — {property.address.pincode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-medium block">Live Availability</span>
              <span className="text-sm font-extrabold text-[#173327] flex items-center gap-1">
                <Bed className="w-4 h-4 text-[#E06D3B]" />
                {availableBedCount} {availableBedCount === 1 ? 'Bed' : 'Beds'} Open
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#ECE8DD]">
          <Image
            src={primaryImage!}
            alt={property.name}
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="space-y-4 flex flex-col justify-between">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#ECE8DD] h-1/2">
            <Image
              src={property.images?.[1] || primaryImage!}
              alt="Room view"
              fill
              className="object-cover"
            />
          </div>
          <div className="bg-[#F7F5EE] border border-[#ECE8DD] rounded-2xl p-5 flex flex-col justify-between h-1/2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#173327] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E06D3B]" />
                Freshness Audited
              </span>
              <p className="text-[11px] text-[#3D3A33] leading-relaxed">
                Bed inventory was verified directly by property warden within the last 24 hours. Zero phantom availability.
              </p>
            </div>
            <div className="pt-2 text-xs font-semibold text-[#173327]">
              Total Verified Rooms: {roomTypes.length} Configurations
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Trust Passport Verification Audit */}
          <TrustPassportCard
            passport={passport}
            propertyName={property.name}
          />

          {/* Description */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#173327]">About this accommodation</h2>
            <p className="text-xs sm:text-sm text-[#3D3A33] leading-relaxed">
              {property.description}
            </p>
          </section>

          {/* Room Types & Exact Pricing Breakdown */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#173327]">Available Room Options</h2>
              <span className="text-xs font-medium text-[#3D3A33]">Transparent monthly rent</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roomTypes.map((rt) => (
                <div
                  key={rt.id}
                  className="bg-white border border-[#ECE8DD] rounded-xl p-5 shadow-sm space-y-3 hover:border-[#173327] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#173327]">{rt.name}</h3>
                      <span className="text-[11px] text-[#E06D3B] font-semibold">
                        {rt.sharingType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#173327]">
                        {formatCurrency(rt.baseRent)}
                      </span>
                      <span className="text-[10px] text-gray-500 block">/ month</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#ECE8DD] space-y-1.5 text-xs text-[#3D3A33]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#173327]" />
                      <span>Security Deposit: {formatCurrency(rt.deposit)}</span>
                    </div>
                    {rt.attachedBathroom && (
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Attached Private Bathroom</span>
                      </div>
                    )}
                    {rt.ac && (
                      <div className="flex items-center gap-2 text-blue-800">
                        <Snowflake className="w-3.5 h-3.5" />
                        <span>Air Conditioned Room</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Real-time Room & Bed Selection with Redis Temporary Hold */}
          <section id="room-bed-selection" className="scroll-mt-24">
            <RoomBedSelector
              propertyId={property.id}
              propertyName={property.name}
              propertySlug={property.slug}
            />
          </section>

          {/* Total Living Cost Interactive Breakdown */}
          <TotalLivingCostWidget
            propertyId={property.id}
            roomTypes={roomTypes}
          />

          {/* House Rules */}
          {property.rules && property.rules.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#173327]">Property Rules & Guidelines</h2>
              <div className="bg-white border border-[#ECE8DD] rounded-xl p-5 divide-y divide-[#ECE8DD]">
                {property.rules.map((rule, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center gap-2.5 text-xs text-[#3D3A33]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E06D3B]" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Verified Resident Reviews & Ratings */}
          <PropertyReviewsSection
            propertyId={property.id}
            propertyName={property.name}
          />
        </div>

        {/* Sticky Action Sidebar */}
        <div>
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-6 shadow-sm space-y-5 sticky top-24">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                Monthly Starting Rent
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#173327]">
                  {formatCurrency(roomTypes[0]?.baseRent || 0)}
                </span>
                <span className="text-xs text-gray-500">/ month</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#ECE8DD]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3D3A33]">Availability Status:</span>
                <span className="font-bold text-emerald-700">{availableBedCount} Beds Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3D3A33]">Security Deposit:</span>
                <span className="font-semibold text-[#173327]">1 Month Rent</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3D3A33]">Lock-in Period:</span>
                <span className="font-semibold text-[#173327]">3 Months</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-2">
              <a
                href="#room-bed-selection"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Select Room & Bed</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setVisitModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#173327] bg-[#F0F5F2] hover:bg-[#DCE8E2] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#173327]" />
                <span>Schedule a Free Visit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        propertyId={property.id}
        propertyName={property.name}
      />
    </main>
  );
}
