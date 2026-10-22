'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronRight,
  Phone,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { VisitStatus } from '@apna-ghar/shared-types';

interface PopulatedVisit {
  id: string;
  studentId: string;
  propertyId: {
    id?: string;
    _id?: string;
    name: string;
    slug: string;
    images?: string[];
    address?: {
      street: string;
      city: string;
      state: string;
    };
    propertyType?: string;
  };
  scheduledAt: string;
  slot: string;
  contactPhone?: string;
  status: VisitStatus;
  notes?: string;
  cancelledReason?: string;
  createdAt: string;
}

export default function StudentVisitsPage() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: visits, isLoading, isError } = useQuery<PopulatedVisit[]>({
    queryKey: ['student-visits'],
    queryFn: () => apiClient<PopulatedVisit[]>('/visits/student'),
  });

  const cancelMutation = useMutation({
    mutationFn: (visitId: string) =>
      apiClient(`/visits/${visitId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: VisitStatus.CANCELLED,
          reason: 'Cancelled by student via dashboard',
        }),
      }),
    onSuccess: () => {
      setCancellingId(null);
      queryClient.invalidateQueries({ queryKey: ['student-visits'] });
    },
    onError: () => {
      setCancellingId(null);
    },
  });

  const getStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.REQUESTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Awaiting Confirmation
          </span>
        );
      case VisitStatus.CONFIRMED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCE8E2] text-[#173327] border border-[#BBD4C8]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#173327]" />
            Visit Confirmed
          </span>
        );
      case VisitStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case VisitStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#173327] tracking-tight">
              My Scheduled Visits
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCE8E2] text-[#173327]">
              {visits?.length || 0} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#3D3A33]">
            Track upcoming free on-site physical visits and manage your schedule.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4" />
          <span>Find More Accommodations</span>
        </Link>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#ECE8DD] p-5 animate-pulse space-y-3"
            >
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">Unable to load visits</h3>
          <p className="text-xs text-red-700">
            Please make sure you are logged in to your student account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327]"
          >
            Go to Login
          </Link>
        </div>
      ) : !visits || visits.length === 0 ? (
        /* Empty State (Lock 4) */
        <div className="bg-white rounded-3xl border border-[#ECE8DD] p-12 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#DCE8E2] text-[#173327] flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8 text-[#173327]" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#173327]">No scheduled visits yet</h3>
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              When you find a PG, hostel, or student flat near your university, click{' '}
              <span className="font-semibold text-[#173327]">“Schedule a Free Visit”</span> to
              physically inspect the rooms before reserving a bed.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-md"
          >
            <span>Explore Accommodations</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Visits List */
        <div className="space-y-4">
          {visits.map((visit) => {
            const property = visit.propertyId;
            const propSlug = property?.slug || '';
            const propImage: string =
              property?.images && property.images.length > 0 && property.images[0]
                ? property.images[0]
                : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80';

            const visitDate = new Date(visit.scheduledAt).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            const canCancel =
              visit.status === VisitStatus.REQUESTED || visit.status === VisitStatus.CONFIRMED;

            return (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-[#ECE8DD] p-5 shadow-xs hover:border-[#173327] transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#ECE8DD] shrink-0">
                    <Image
                      src={propImage}
                      alt={property?.name || 'Accommodation'}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/property/${propSlug}`}
                        className="text-sm sm:text-base font-bold text-[#173327] hover:text-[#E06D3B] transition-colors"
                      >
                        {property?.name}
                      </Link>
                      {getStatusBadge(visit.status)}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#3D3A33]">
                      <MapPin className="w-3.5 h-3.5 text-[#E06D3B] shrink-0" />
                      <span>
                        {property?.address?.street}, {property?.address?.city}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-[#173327] font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#173327]" />
                        {visitDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#173327]" />
                        Slot: {visit.slot}
                      </span>
                    </div>

                    {visit.contactPhone && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Gate Contact: {visit.contactPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ECE8DD]">
                  <Link
                    href={`/property/${propSlug}`}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#173327] bg-[#F0F5F2] hover:bg-[#DCE8E2] transition-colors"
                  >
                    View Property
                  </Link>

                  {canCancel && (
                    <button
                      type="button"
                      disabled={cancellingId === visit.id}
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this scheduled visit?')) {
                          setCancellingId(visit.id);
                          cancelMutation.mutate(visit.id);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {cancellingId === visit.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Visit'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
