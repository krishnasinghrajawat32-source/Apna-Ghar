'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BedDouble,
  Info,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useBedHoldStore } from '@/features/inventory/bed-hold-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { UserRole } from '@apna-ghar/shared-types';

interface ChargesPreview {
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  bedLabel: string;
  baseRent: number;
  deposit: number;
  totalInitialAmount: number;
}

export default function BookingCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bedIdParam = searchParams.get('bedId');

  const { activeHold, releaseHold } = useBedHoldStore();

  const bedId = bedIdParam || activeHold?.bedId;

  const [moveInDate, setMoveInDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  );
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: charges, isLoading: isChargesLoading } = useQuery<ChargesPreview>({
    queryKey: ['charges-preview', bedId],
    queryFn: () => apiClient<ChargesPreview>(`/bookings/preview-charges?bedId=${bedId}`),
    enabled: !!bedId,
  });

  const bookingMutation = useMutation({
    mutationFn: (payload: {
      bedId: string;
      moveInDate: string;
      emergencyContact: { name: string; relationship: string; phone: string };
      specialRequests?: string;
    }) =>
      apiClient('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setIsSuccess(true);
      if (activeHold) {
        releaseHold();
      }
      setTimeout(() => {
        router.push('/student/bookings');
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to submit booking request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedId) {
      setErrorMessage('No bed selected for booking request.');
      return;
    }
    if (!emergencyName || !emergencyPhone) {
      setErrorMessage('Please provide emergency contact details.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(emergencyPhone)) {
      setErrorMessage('Emergency contact must be a valid 10-digit Indian mobile number.');
      return;
    }

    setErrorMessage('');
    bookingMutation.mutate({
      bedId,
      moveInDate: new Date(moveInDate || Date.now()).toISOString(),
      emergencyContact: {
        name: emergencyName,
        relationship: emergencyRelation,
        phone: emergencyPhone,
      },
      specialRequests: specialRequests || undefined,
    });
  };

  if (!bedId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <BedDouble className="w-12 h-12 text-[#687586] mx-auto" />
        <h2 className="text-xl font-black text-[#102B50]">No Bed Selected</h2>
        <p className="text-xs text-[#687586] max-w-sm">
          Please select an available bed from an accommodation listing before submitting a booking request.
        </p>
        <Link
          href="/search"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition"
        >
          Find Accommodations
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2 pb-6 border-b border-[#E8E5DE]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#102B50]/10 text-[#102B50]">
            <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Accommodation Request Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#102B50] tracking-tight">
            Submit Booking Request
          </h1>
          <p className="text-xs text-[#687586]">
            Review accommodation details and submit your stay request for the property owner to review and accept.
          </p>
        </div>

        {/* Scope Notice */}
        <div className="bg-[#FAF8F3] border border-[#E8E5DE] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#263445]">
          <Info className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#102B50] block">Request Workflow (Payment Out of Scope)</span>
            <p className="text-[#687586]">
              Submitting this form creates a formal booking request with the property owner. No payment gateway or checkout is processed online. Prices shown below are listing reference values only.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#D64545]/10 border border-[#D64545]/30 text-xs text-[#D64545] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="bg-white border border-[#21865B]/30 rounded-3xl p-10 text-center space-y-4 shadow-brand-sm">
            <CheckCircle2 className="w-12 h-12 text-[#21865B] mx-auto animate-bounce" />
            <h2 className="text-xl font-black text-[#102B50]">Booking Request Submitted!</h2>
            <p className="text-xs text-[#687586] max-w-md mx-auto leading-relaxed">
              Your stay request has been successfully transmitted to the property owner. You will now be redirected to your bookings page to track status updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
              <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-5">
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2 pb-3 border-b border-[#E8E5DE]">
                  <Calendar className="w-4 h-4 text-[#F5A623]" />
                  <span>Stay Details</span>
                </h2>

                <div>
                  <label className="block text-xs font-bold text-[#102B50] mb-1.5">
                    Anticipated Move-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full p-3 border border-[#E8E5DE] rounded-xl text-xs bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                  <span className="text-[10px] text-[#687586] mt-1 block">
                    Must be within the next 60 days
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102B50] mb-1.5">
                    Special Requests or Move-In Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Arriving late evening on move-in date, requiring upper study table arrangement..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full p-3 border border-[#E8E5DE] rounded-xl text-xs bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-4">
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2 pb-3 border-b border-[#E8E5DE]">
                  <Phone className="w-4 h-4 text-[#F5A623]" />
                  <span>Emergency Contact Details</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#102B50] mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#102B50] mb-1">Relationship *</label>
                    <select
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Relative</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#102B50] mb-1">10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-extrabold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{bookingMutation.isPending ? 'Submitting Request...' : 'Submit Booking Request'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Sidebar Summary */}
            <div className="space-y-4">
              <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm space-y-4">
                <h3 className="text-sm font-black text-[#102B50] pb-2 border-b border-[#E8E5DE]">
                  Selected Accommodation
                </h3>

                {isChargesLoading ? (
                  <div className="py-6 text-center text-xs text-[#687586]">Loading bed details...</div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#687586] block uppercase tracking-wider">Property</span>
                      <span className="font-bold text-[#102B50] text-sm block">
                        {charges?.propertyName || activeHold?.propertyName || 'Verified Property'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DE]">
                      <span className="text-[#687586]">Room & Bed:</span>
                      <span className="font-bold text-[#102B50]">
                        Room {charges?.roomNumber || activeHold?.roomNumber} • {charges?.bedLabel || activeHold?.bedLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DE]">
                      <span className="text-[#687586]">Monthly Rent:</span>
                      <span className="font-bold text-[#102B50]">
                        {formatCurrency(charges?.baseRent || activeHold?.baseRent || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#687586]">Security Deposit:</span>
                      <span className="font-bold text-[#102B50]">
                        {formatCurrency(charges?.deposit || 0)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#E8E5DE] text-[10px] text-[#687586]">
                      * Rent and deposit values are displayed for listing reference only. Payment processing is deferred.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
