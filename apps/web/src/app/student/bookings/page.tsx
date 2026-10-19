'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Building,
  CreditCard,
  Phone,
  ArrowRight,
  AlertCircle,
  BedDouble,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Booking, BookingStatus } from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';

export default function StudentBookingsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const {
    data: bookings,
    isLoading,
  } = useQuery<Booking[]>({
    queryKey: ['student-bookings'],
    queryFn: () => apiClient<Booking[]>('/bookings/student'),
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      apiClient<Booking>(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: BookingStatus.CANCELLED,
          reason: reason || 'Cancelled by student',
        }),
      }),
    onSuccess: () => {
      setCancelModalId(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['student-bookings'] });
    },
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading your bookings...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-[#ECE8DD] rounded-2xl shadow-sm space-y-4">
          <FileText className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#173327]">Sign In Required</h2>
          <p className="text-xs text-[#3D3A33]">
            Please sign in to view your accommodation bookings and reservations.
          </p>
          <Link
            href="/login?returnUrl=/student/bookings"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const bookingList = bookings ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#173327] flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>My Accommodation Bookings</span>
          </h1>
          <p className="text-xs text-[#3D3A33] mt-1">
            Track your bed reservations, move-in schedules, and confirmed stays.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition shadow-xs"
        >
          <span>Find Stays</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Lock 4 Compliant Empty State */}
      {bookingList.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <BedDouble className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">No Bookings Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              You haven&apos;t reserved or booked any student rooms yet. Search verified accommodations near your college to select your exact bed.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Explore Verified Hostels & PGs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingList.map((booking) => {
            const isPending = booking.status === BookingStatus.PENDING_PAYMENT;
            const isConfirmed = booking.status === BookingStatus.CONFIRMED;
            const isCancelled = booking.status === BookingStatus.CANCELLED;

            return (
              <div
                key={booking.id}
                className="bg-white border border-[#ECE8DD] rounded-2xl p-5 sm:p-6 shadow-sm hover:border-[#173327]/30 transition space-y-4"
              >
                {/* Top Row: Ref & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ECE8DD]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-white bg-slate-900 px-2.5 py-1 rounded-lg tracking-wider">
                      {booking.bookingReference}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      Booked on{' '}
                      {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Pending Payment
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Booking
                    </span>
                  )}
                  {isCancelled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelled
                    </span>
                  )}
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Accommodation</span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{booking.property?.name || 'Verified Property'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Room & Bed</span>
                    <span className="font-semibold text-slate-900">
                      Room {booking.room?.roomNumber || '—'} • {booking.bed?.bedLabel || 'Bed'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Move-In Date</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Total Initial Amount</span>
                    <span className="font-black text-sm text-[#173327]">
                      {formatCurrency(booking.totalInitialPayment)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Rent: {formatCurrency(booking.rentAmount)} + Deposit: {formatCurrency(booking.depositAmount)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Actions & Emergency Contact */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#ECE8DD]">
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>
                      Emergency Contact: {booking.emergencyContact?.name} ({booking.emergencyContact?.relationship}) • {booking.emergencyContact?.phone}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCancelModalId(booking.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                      >
                        Cancel Booking
                      </button>

                      <Link
                        href={`/student/bookings/${booking.id}/pay`}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Booking Amount</span>
                      </Link>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Bed Locked for Check-in</span>
                      </div>

                      <Link
                        href={`/student/bookings/${booking.id}/pass`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] shadow-xs transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View Move-In Pass</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Cancel Reservation</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this booking? This will immediately release your reserved bed so other students can book it.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for cancellation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Change in college plans"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Keep Booking
              </button>
              <button
                onClick={() =>
                  cancelMutation.mutate({
                    bookingId: cancelModalId,
                    reason: cancelReason,
                  })
                }
                disabled={cancelMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
