'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Booking, BookingStatus, PaymentOrderResponse, PaymentMethod } from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';
import { useBedHoldStore } from '@/features/inventory/bed-hold-store';

export default function BookingPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { clearHold } = useBedHoldStore();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data: booking, isLoading: isBookingLoading } = useQuery<Booking>({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => apiClient<Booking>(`/bookings/${bookingId}`),
    enabled: !!bookingId && isAuthenticated,
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create Order with gateway
      const orderRes = await apiClient<PaymentOrderResponse>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });

      // Step 2: Complete payment via sandbox simulator
      return apiClient<{ success: boolean; bookingReference: string }>('/payments/simulate', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderRes.orderId,
          method: selectedMethod,
        }),
      });
    },
    onSuccess: () => {
      clearHold();
      router.push(`/student/bookings/${bookingId}/receipt`);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setPaymentError(err.message);
      } else if (err instanceof Error) {
        setPaymentError(err.message);
      } else {
        setPaymentError('Payment failed. Please try again.');
      }
    },
  });

  if (isAuthLoading || isBookingLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <CreditCard className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Initializing secure payment checkout...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-[#ECE8DD] rounded-2xl shadow-sm space-y-4">
          <Lock className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#173327]">Authentication Required</h2>
          <p className="text-xs text-[#3D3A33]">Please sign in to complete your accommodation booking payment.</p>
          <Link
            href={`/login?returnUrl=/student/bookings/${bookingId}/pay`}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Booking Not Found</h2>
          <p className="text-xs text-slate-600">The requested reservation does not exist or you do not have permission to access it.</p>
          <Link
            href="/student/bookings"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Return to Bookings</span>
          </Link>
        </div>
      </div>
    );
  }

  // If already confirmed
  if (booking.status === BookingStatus.CONFIRMED) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#173327]">Booking Already Paid & Confirmed</h2>
          <p className="text-xs text-slate-600">
            Payment has already been received for reference <strong>{booking.bookingReference}</strong>.
          </p>
          <Link
            href={`/student/bookings/${bookingId}/receipt`}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
          >
            <span>View Official Payment Receipt</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
            {booking.bookingReference}
          </span>
          <span className="text-xs text-slate-500">• Secure Checkout</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#173327]">
          Complete Initial Booking Payment
        </h1>
        <p className="text-xs text-[#3D3A33]">
          Finalize your bed reservation to secure your stay before moving in.
        </p>
      </div>

      {paymentError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payment Notice</p>
            <p className="mt-0.5">{paymentError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Payment Methods */}
        <div className="md:col-span-2 space-y-6">
          {/* Method Selection */}
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#173327] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Choose Payment Method</span>
            </h2>

            <div className="space-y-2.5">
              {/* UPI */}
              <label
                onClick={() => setSelectedMethod('UPI')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedMethod === 'UPI'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">UPI Instant Payment</span>
                    <span className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'UPI'}
                  onChange={() => setSelectedMethod('UPI')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {/* Cards */}
              <label
                onClick={() => setSelectedMethod('CARD')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedMethod === 'CARD'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Debit / Credit Card</span>
                    <span className="text-[11px] text-slate-500">Visa, MasterCard, RuPay</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'CARD'}
                  onChange={() => setSelectedMethod('CARD')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {/* Netbanking */}
              <label
                onClick={() => setSelectedMethod('NETBANKING')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedMethod === 'NETBANKING'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Net Banking</span>
                    <span className="text-[11px] text-slate-500">All major Indian banks (HDFC, ICICI, SBI)</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={selectedMethod === 'NETBANKING'}
                  onChange={() => setSelectedMethod('NETBANKING')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">100% Refundable Security Deposit</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Your deposit is securely held in an escrow-compatible account and returned promptly upon completion of stay.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div>
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 sticky top-24">
            <h2 className="text-sm font-bold text-[#173327] flex items-center gap-2 pb-2 border-b border-[#ECE8DD]">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Stay Summary</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Room:</span>
                <span className="font-semibold text-slate-900">Room {booking.room?.roomNumber || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bed:</span>
                <span className="font-semibold text-slate-900">{booking.bed?.bedLabel || 'Bed'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Move-in:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECE8DD] space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Rent:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(booking.rentAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Deposit (Refundable):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                <span>Platform Fee:</span>
                <span>₹0 (Free)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECE8DD] flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-[#173327] block">Total Initial Due</span>
                <span className="text-[10px] text-slate-500">Rent + Deposit</span>
              </div>
              <span className="text-xl font-black text-[#173327]">
                {formatCurrency(booking.totalInitialPayment)}
              </span>
            </div>

            <button
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {paymentMutation.isPending ? 'Processing Payment...' : `Pay ${formatCurrency(booking.totalInitialPayment)} Now`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
