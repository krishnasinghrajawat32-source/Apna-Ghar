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
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-3">
        <Clock className="w-8 h-8 text-[#102B50] animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#687586]">Loading your accommodation bookings...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white border border-[#E8E5DE] rounded-3xl shadow-brand-sm space-y-4">
          <FileText className="w-10 h-10 text-[#102B50] mx-auto" />
          <h2 className="text-lg font-black text-[#102B50]">Sign In Required</h2>
          <p className="text-xs text-[#687586]">
            Please sign in to view your accommodation bookings and reservations.
          </p>
          <Link
            href="/login?returnUrl=/student/bookings"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm"
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
          <h1 className="text-xl sm:text-2xl font-black text-[#102B50] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#F5A623]" />
            <span>My Accommodation Bookings</span>
          </h1>
          <p className="text-xs text-[#687586] mt-1">
            Track your bed reservations, move-in schedules, and confirmed stays.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition shadow-xs"
        >
          <span>Find Stays</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty State */}
      {bookingList.length === 0 ? (
        <div className="p-16 text-center bg-white border border-dashed border-[#E8E5DE] rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-[#FAF8F3] border border-[#E8E5DE] rounded-3xl flex items-center justify-center mx-auto text-[#102B50]">
            <BedDouble className="w-8 h-8 text-[#F5A623]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-[#102B50]">No Bookings Yet</h3>
            <p className="text-xs text-[#687586] max-w-sm mx-auto leading-relaxed">
              You haven&apos;t reserved or booked any student rooms yet. Search verified accommodations near your college to select your exact bed.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm"
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
                className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm hover:border-[#102B50]/30 transition space-y-4"
              >
                {/* Top Row: Ref & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#E8E5DE]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-white bg-[#102B50] px-3 py-1 rounded-lg tracking-wider">
                      {booking.bookingReference}
                    </span>
                    <span className="text-xs text-[#687586] hidden sm:inline">
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5A623]/15 text-[#102B50] border border-[#F5A623]/30">
                      <Clock className="w-3.5 h-3.5 text-[#F5A623] animate-pulse" />
                      Pending Payment
                    </span>
                  )}
                  {isConfirmed && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Booking
                    </span>
                  )}
                  {isCancelled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20">
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelled
                    </span>
                  )}
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#687586] block mb-0.5">Accommodation</span>
                    <span className="font-bold text-[#102B50] text-sm flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#687586] shrink-0" />
                      <span>{booking.property?.name || 'Verified Property'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[#687586] block mb-0.5">Room & Bed</span>
                    <span className="font-bold text-[#263445]">
                      Room {booking.room?.roomNumber || '—'} • {booking.bed?.bedLabel || 'Bed'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#687586] block mb-0.5">Move-In Date</span>
                    <span className="font-bold text-[#263445] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#687586]" />
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
                    <span className="text-[#687586] block mb-0.5">Total Initial Amount</span>
                    <span className="font-black text-sm text-[#102B50]">
                      {formatCurrency(booking.totalInitialPayment)}
                    </span>
                    <span className="text-[10px] text-[#687586] block">
                      Rent: {formatCurrency(booking.rentAmount)} + Deposit: {formatCurrency(booking.depositAmount)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Actions & Emergency Contact */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-[#E8E5DE]">
                  <div className="text-[11px] text-[#687586] flex items-center gap-2">
                    <Phone className="w-3 h-3 text-[#687586]" />
                    <span>
                      Emergency Contact: {booking.emergencyContact?.name} ({booking.emergencyContact?.relationship}) • {booking.emergencyContact?.phone}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCancelModalId(booking.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#D64545] hover:bg-[#D64545]/10 border border-[#D64545]/30 transition"
                      >
                        Cancel Booking
                      </button>

                      <Link
                        href={`/student/bookings/${booking.id}/pay`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] shadow-sm transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Booking Amount</span>
                      </Link>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#21865B] font-bold bg-[#21865B]/10 px-3 py-1 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-[#21865B]" />
                        <span>Bed Locked for Check-in</span>
                      </div>

                      <Link
                        href={`/student/bookings/${booking.id}/pass`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] shadow-xs transition"
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E5DE] space-y-4">
            <div className="flex items-center gap-2 text-[#D64545]">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-[#102B50]">Cancel Reservation</h3>
            </div>
            <p className="text-xs text-[#687586] leading-relaxed">
              Are you sure you want to cancel this booking? This will immediately release your reserved bed so other students can book it.
            </p>

            <div>
              <label className="text-xs font-bold text-[#102B50] block mb-1.5">
                Reason for cancellation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Change in university admission schedule"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#E8E5DE] text-[#263445] bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#D64545]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#687586] hover:bg-[#FAF8F3] transition"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D64545] hover:bg-[#D64545]/90 transition disabled:opacity-50"
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
