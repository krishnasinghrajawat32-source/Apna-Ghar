'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  MessageCircle,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Property, RoomType, PropertyStatus, TrustPassport, UserRole } from '@apna-ghar/shared-types';
import { TrustPassportCard } from '@/components/verification/trust-passport-card';
import { TotalLivingCostWidget } from '@/components/pricing/total-living-cost-widget';
import { ScheduleVisitModal } from '@/components/visits/schedule-visit-modal';
import { RoomBedSelector } from '@/components/inventory/room-bed-selector';
import { PropertyReviewsSection } from '@/components/reviews/property-reviews-section';
import { useAuthStore } from '@/features/auth/auth-store';

interface PropertyDetailResponse {
  property: Property;
  roomTypes: RoomType[];
  availableBedCount: number;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [chatError, setChatError] = useState('');
  const [openingChat, setOpeningChat] = useState(false);

  const { data, isLoading, isError } = useQuery<PropertyDetailResponse>({
    queryKey: ['property-detail', slug],
    queryFn: () => apiClient<PropertyDetailResponse>(`/properties/${slug}`),
    enabled: !!slug,
  });

  const propertyId = data?.property?.id;

  const { data: passportRes } = useQuery<TrustPassport>({
    queryKey: ['property-trust-passport', propertyId],
    queryFn: () => apiClient<TrustPassport>(`/properties/${propertyId}/trust-passport`),
    enabled: !!propertyId,
  });

  const passport = (passportRes as any)?.data ?? passportRes ?? null;
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  const openOwnerChat = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/property/${slug}`)}`);
      return;
    }
    if (user.role !== UserRole.STUDENT) {
      setChatError('Only student accounts can start property enquiries.');
      return;
    }

    setOpeningChat(true);
    setChatError('');
    try {
      const conversation = await apiClient<{ id: string }>('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ propertyId: data?.property.id }),
      });
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      setChatError(error instanceof ApiError ? error.message : 'Unable to open a chat right now.');
    } finally {
      setOpeningChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#102B50] border-t-[#F5A623] rounded-full animate-spin" />
          <p className="text-xs text-[#263445] font-semibold">Verifying accommodation records...</p>
        </div>
      </div>
    );
  }

  if (isError || !data || !data.property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#FAF8F3]">
        <h2 className="text-xl font-black text-[#102B50]">Property Not Found</h2>
        <p className="text-xs text-[#687586] max-w-md">
          The requested student property does not exist or has been deactivated.
        </p>
        <Link
          href="/search"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition-colors"
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
      <div className="space-y-3 pb-6 border-b border-[#E8E5DE]">
        <div className="flex flex-wrap items-center gap-2">
          {property.status === PropertyStatus.ACTIVE ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#102B50] text-white shadow-sm border border-white/20">
              <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
              Trust Passport Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#263445]/10 text-[#263445]">
              Verification in Progress
            </span>
          )}

          <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#102B50]/10 text-[#102B50]">
            {property.propertyType} • {property.genderPreference} • {property.furnishing.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black text-[#102B50] tracking-tight">
              {property.name}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#263445]">
              <MapPin className="w-4 h-4 text-[#F5A623] shrink-0" />
              <span>
                {property.address.street}, {property.address.city}, {property.address.state} — {property.address.pincode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-[#687586] font-bold block uppercase tracking-wider">Live Inventory</span>
              <span className="text-sm font-black text-[#21865B] flex items-center gap-1">
                <Bed className="w-4 h-4 text-[#21865B]" />
                {availableBedCount} {availableBedCount === 1 ? 'Bed' : 'Beds'} Ready to Book
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative aspect-[16/10] rounded-3xl overflow-hidden bg-[#E8E5DE] shadow-brand-sm">
          <Image
            src={primaryImage!}
            alt={property.name}
            fill
            unoptimized
            referrerPolicy="no-referrer"
            priority
            className="object-cover"
          />
        </div>
        <div className="space-y-4 flex flex-col justify-between">
          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-[#E8E5DE] h-1/2 shadow-brand-sm">
            <Image
              src={property.images?.[1] || primaryImage!}
              alt="Room view"
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 flex flex-col justify-between h-1/2 shadow-brand-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                Freshness Audited
              </span>
              <p className="text-[11px] text-[#687586] leading-relaxed">
                Bed inventory was verified directly by property warden within the last 24 hours. Zero phantom availability.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#102B50]">
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
          <section className="space-y-3 bg-white p-6 rounded-3xl border border-[#E8E5DE] shadow-brand-sm">
            <h2 className="text-base font-extrabold text-[#102B50]">About this accommodation</h2>
            <p className="text-xs sm:text-sm text-[#263445] leading-relaxed">
              {property.description}
            </p>
          </section>

          {/* Room Types & Exact Pricing Breakdown */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#102B50]">Available Room Options</h2>
              <span className="text-xs font-semibold text-[#687586]">Transparent monthly rent</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roomTypes.map((rt) => (
                <div
                  key={rt.id}
                  className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm space-y-4 hover:border-[#102B50] hover:shadow-brand-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#102B50]">{rt.name}</h3>
                      <span className="text-[11px] text-[#F5A623] font-bold uppercase tracking-wider">
                        {rt.sharingType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#102B50]">
                        {formatCurrency(rt.baseRent)}
                      </span>
                      <span className="text-[10px] text-[#687586] font-semibold block">/ month</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8E5DE] space-y-2 text-xs text-[#263445]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#102B50]" />
                      <span>Security Deposit: {formatCurrency(rt.deposit)}</span>
                    </div>
                    {rt.attachedBathroom && (
                      <div className="flex items-center gap-2 text-[#21865B] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Attached Private Bathroom</span>
                      </div>
                    )}
                    {rt.ac && (
                      <div className="flex items-center gap-2 text-[#102B50] font-semibold">
                        <Snowflake className="w-3.5 h-3.5 text-[#102B50]" />
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
            <section className="space-y-3 bg-white p-6 rounded-3xl border border-[#E8E5DE] shadow-brand-sm">
              <h2 className="text-base font-extrabold text-[#102B50]">Property Rules & Guidelines</h2>
              <div className="divide-y divide-[#E8E5DE]">
                {property.rules.map((rule, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-2.5 text-xs text-[#263445]">
                    <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
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
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-md space-y-6 sticky top-24">
            <div className="space-y-1">
              <span className="text-[10px] text-[#687586] font-bold uppercase tracking-wider">
                Monthly Starting Rent
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#102B50]">
                  {formatCurrency(roomTypes[0]?.baseRent || 0)}
                </span>
                <span className="text-xs text-[#687586] font-semibold">/ month</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E8E5DE]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#687586]">Availability Status:</span>
                <span className="font-bold text-[#21865B]">{availableBedCount} Beds Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#687586]">Security Deposit:</span>
                <span className="font-bold text-[#102B50]">1 Month Rent</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#687586]">Lock-in Period:</span>
                <span className="font-bold text-[#102B50]">3 Months</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <a
                href="#room-bed-selection"
                className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer active:scale-98"
              >
                <span>Book Room</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setVisitModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#102B50] bg-[#FAF8F3] hover:bg-[#F0F4F8] border border-[#E8E5DE] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Calendar className="w-4 h-4 text-[#102B50]" />
                <span>Schedule a Free Visit</span>
              </button>
              <button
                type="button"
                onClick={openOwnerChat}
                disabled={openingChat || property.status !== PropertyStatus.ACTIVE}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4 text-[#F5A623]" />
                <span>{openingChat ? 'Opening chat…' : 'Chat with Owner'}</span>
              </button>
              {chatError && (
                <p role="alert" className="text-xs text-red-600">
                  {chatError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        propertyId={property.id || (property as any)._id}
        propertyName={property.name}
      />
    </main>
  );
}
