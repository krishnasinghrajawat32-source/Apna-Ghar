'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  Lock,
  Building,
  User,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  BookingChargeBreakdown,
  BedHoldStatus,
  Booking,
} from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';
import { useBedHoldStore } from '@/features/inventory/bed-hold-store';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const bedId = searchParams.get('bedId');

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { activeHold, decrementTtl } = useBedHoldStore();

  const [moveInDate, setMoveInDate] = useState<string>('');
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyRelationship, setEmergencyRelationship] = useState<string>('Parent');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [studentIdCardRef, setStudentIdCardRef] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Set default move-in date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMoveInDate(tomorrow.toISOString().split('T')[0] ?? '');
  }, []);

  // Tick down the active hold timer
  useEffect(() => {
    if (!activeHold) return;
    const interval = setInterval(() => {
      decrementTtl();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeHold, decrementTtl]);

  // Query hold status from backend
  const { data: holdStatus, isLoading: isHoldLoading } = useQuery<BedHoldStatus>({
    queryKey: ['bed-hold-status', bedId],
    queryFn: () => apiClient<BedHoldStatus>(`/inventory/beds/${bedId}/hold-status`),
    enabled: !!bedId,
  });

  // Query charges preview
  const { data: charges, isLoading: isChargesLoading } = useQuery<BookingChargeBreakdown>({
    queryKey: ['charges-preview', bedId],
    queryFn: () => apiClient<BookingChargeBreakdown>(`/bookings/preview-charges?bedId=${bedId}`),
    enabled: !!bedId,
  });

  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: (payload: {
      bedId: string;
      moveInDate: string;
      emergencyContact: { name: string; relationship: string; phone: string };
      studentIdCardRef?: string;
    }) =>
      apiClient<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setConfirmedBooking(data);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to create booking. Please check your connection and try again.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!bedId) {
      setFormError('No bed selected for checkout.');
      return;
    }

    if (!emergencyName.trim()) {
      setFormError('Please enter emergency contact name.');
      return;
    }

    const cleanPhone = emergencyPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Emergency contact phone must be a valid 10-digit Indian mobile number.');
      return;
    }

    bookingMutation.mutate({
      bedId,
      moveInDate,
      emergencyContact: {
        name: emergencyName.trim(),
        relationship: emergencyRelationship,
        phone: cleanPhone,
      },
      studentIdCardRef: studentIdCardRef.trim() || undefined,
    });
  };

  if (isAuthLoading || isHoldLoading || isChargesLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying bed reservation lock...</p>
      </div>
    );
  }

  // If student is not logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-[#ECE8DD] rounded-2xl shadow-sm space-y-4">
          <Lock className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#173327]">Student Authentication Required</h2>
          <p className="text-xs text-[#3D3A33]">
            Please sign in to verify your identity and finalize your bed reservation.
          </p>
          <Link
            href={`/login?returnUrl=/booking/checkout?bedId=${bedId || ''}`}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // If no bedId or hold has expired
  if (!bedId || !holdStatus?.isHeld || !holdStatus?.heldByCurrentStudent) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-amber-200 rounded-2xl shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Bed Reservation Lock Expired</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your 8-minute temporary hold has either expired or this bed is not currently locked for your account. Please select an available bed from the property page to reserve it.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Browse Available Accommodations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Successful booking confirmation state
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              Reservation Confirmed
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#173327] pt-2">
              Booking Created Successfully!
            </h1>
            <p className="text-xs text-slate-600">
              Your bed is formally booked in our database under reference code:
            </p>
            <div className="inline-block px-4 py-2 bg-slate-900 text-white font-mono font-bold text-base rounded-xl mt-2 tracking-wider">
              {confirmedBooking.bookingReference}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left divide-y divide-slate-200 text-xs space-y-2">
            <div className="flex justify-between py-1.5 first:pt-0">
              <span className="text-slate-500">Move-in Date:</span>
              <span className="font-semibold text-slate-900">
                {new Date(confirmedBooking.moveInDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Monthly Rent:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(confirmedBooking.rentAmount)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Security Deposit:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(confirmedBooking.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-sm text-[#173327]">
              <span>Total Initial Payment:</span>
              <span>{formatCurrency(confirmedBooking.totalInitialPayment)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/student/bookings"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>View in My Bookings</span>
            </Link>

            <Link
              href="/search"
              className="py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Explore More Stays
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0] ?? '';
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0] ?? '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Page Title */}
      <div className="mb-6 space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-[#173327]">
          Confirm Bed Reservation & Pre-Payment
        </h1>
        <p className="text-xs text-[#3D3A33]">
          Step 3 of 3: Review all charges transparently and enter emergency details.
        </p>
      </div>

      {/* Redis Lock Notice */}
      <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Bed is locked for <strong>{user?.name || 'you'}</strong>. Zero chance of another student stealing your selection.
          </span>
        </div>
        {activeHold && activeHold.ttlSecondsRemaining > 0 && (
          <div className="flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-200/60 px-2.5 py-1 rounded-lg shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {Math.floor(activeHold.ttlSecondsRemaining / 60)}:
              {String(activeHold.ttlSecondsRemaining % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Move-in Date */}
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#ECE8DD]">
              <Calendar className="w-5 h-5 text-[#173327]" />
              <h2 className="text-sm font-bold text-[#173327]">1. Select Your Move-In Date</h2>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Anticipated Move-In Date *
              </label>
              <input
                type="date"
                required
                min={todayStr}
                max={maxDateStr}
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173327] bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Advance bookings can be made up to 60 days ahead.
              </p>
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#ECE8DD]">
              <Phone className="w-5 h-5 text-[#173327]" />
              <h2 className="text-sm font-bold text-[#173327]">2. Emergency Contact (Mandatory)</h2>
            </div>
            <p className="text-xs text-slate-500">
              Required for hostel register compliance and campus safety verification.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Contact Person Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173327]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Relationship *
                  </label>
                  <select
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173327] bg-white"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Local Guardian</option>
                    <option value="Sibling">Brother / Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173327]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: College Identification Reference */}
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#ECE8DD]">
              <User className="w-5 h-5 text-[#173327]" />
              <h2 className="text-sm font-bold text-[#173327]">3. Student Verification (Optional)</h2>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                College ID Card Reference / Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. AMITY/2026/CSE/1042"
                value={studentIdCardRef}
                onChange={(e) => setStudentIdCardRef(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173327]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Accelerates physical check-in on move-in day.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Transparent Charge Breakdown */}
        <div>
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-6 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center gap-2 pb-3 border-b border-[#ECE8DD]">
              <Building className="w-5 h-5 text-[#173327]" />
              <h2 className="text-sm font-bold text-[#173327]">Itemized Cost Review</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>First Month Base Rent:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(charges?.rentAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Security Deposit (Refundable):</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(charges?.depositAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Platform Brokerage:</span>
                <span>₹0 (Free)</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Move-in Maintenance:</span>
                <span>₹0 (Included)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECE8DD] flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-[#173327] block">
                  Total Initial Payment
                </span>
                <span className="text-[10px] text-slate-500">Rent + 100% Refundable Deposit</span>
              </div>
              <span className="text-xl font-black text-[#173327]">
                {formatCurrency(charges?.totalInitialPayment || 0)}
              </span>
            </div>

            {/* Zero Hidden Fees Guarantee Note */}
            <div className="p-3 rounded-xl bg-[#F0F5F2] border border-[#DCE8E2] text-[11px] text-[#173327] space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Apna Ghar Trust Guarantee</span>
              </div>
              <p className="text-slate-600 leading-normal">
                No brokerage, no surprise utility fees on arrival. What you see is what you pay.
              </p>
            </div>

            <button
              type="submit"
              disabled={bookingMutation.isPending}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {bookingMutation.isPending ? 'Confirming Reservation...' : 'Confirm Bed Booking'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading checkout session...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
