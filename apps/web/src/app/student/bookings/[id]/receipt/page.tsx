'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldCheck,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  AlertTriangle,
  Clock,
  User,
  BedDouble,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { PaymentReceipt } from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';

export default function BookingReceiptPage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  const {
    data: receipt,
    isLoading,
    isError,
  } = useQuery<PaymentReceipt>({
    queryKey: ['payment-receipt', bookingId],
    queryFn: () => apiClient<PaymentReceipt>(`/payments/receipt/${bookingId}`),
    enabled: !!bookingId && isAuthenticated,
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Generating official payment receipt...</p>
      </div>
    );
  }

  if (!receipt || isError) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-sm space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Receipt Not Available</h2>
          <p className="text-xs text-slate-600">
            A verified payment record could not be found for this booking reference.
          </p>
          <Link
            href="/student/bookings"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            <span>Back to My Bookings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          href="/student/bookings"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#173327] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-white border border-[#ECE8DD] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-xs">
                AG
              </div>
              <span className="text-base font-black text-[#173327] tracking-tight">
                APNA GHAR
              </span>
            </div>
            <p className="text-[11px] text-[#E06D3B] font-semibold">Har Sahar Apna Ghar</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Trust-First Verified Student Living</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Payment Verified & Confirmed</span>
            </span>
            <div className="font-mono text-xs font-bold text-slate-900 mt-2">
              Receipt No: {receipt.orderId.replace('order_sim_', 'RCP-').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Reference & Transaction Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px] mb-0.5">Booking Reference</span>
            <span className="font-mono font-bold text-slate-900">{receipt.bookingReference}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] mb-0.5">Transaction ID</span>
            <span className="font-mono text-slate-900 truncate block">{receipt.paymentId}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] mb-0.5">Payment Method</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-slate-500" />
              <span>{receipt.paymentMethod}</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] mb-0.5">Payment Date</span>
            <span className="font-semibold text-slate-900">
              {new Date(receipt.paidAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Accommodation & Student Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
              Student Details
            </h3>
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{receipt.studentName}</span>
              </div>
              <p className="text-[11px] text-slate-500">Verified Student Account</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
              Accommodation Assigned
            </h3>
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>{receipt.propertyName}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <BedDouble className="w-3 h-3 text-slate-400" />
                <span>{receipt.roomNumber} • {receipt.bedLabel}</span>
              </div>
              {receipt.moveInDate && (
                <div className="flex items-center gap-1 text-[11px] text-slate-600">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>
                    Move-in: {new Date(receipt.moveInDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Payment Breakdown */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
            Payment Summary
          </h3>
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-xs">
            <div className="flex justify-between p-3">
              <span className="text-slate-600">Initial Accommodation Booking Amount:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(receipt.amount)}</span>
            </div>
            <div className="flex justify-between p-3 text-emerald-800 font-medium">
              <span>Platform Brokerage Fee:</span>
              <span>₹0 (Included)</span>
            </div>
            <div className="flex justify-between p-3 text-emerald-800 font-medium">
              <span>Payment Gateway Processing Charge:</span>
              <span>₹0 (Waived)</span>
            </div>
            <div className="flex justify-between p-3 font-black text-sm bg-slate-50 text-[#173327] rounded-b-xl">
              <span>Total Amount Paid (INR):</span>
              <span>{formatCurrency(receipt.amount)}</span>
            </div>
          </div>
        </div>

        {/* Move-in Day Instructions */}
        <div className="p-4 rounded-xl bg-[#F0F5F2] border border-[#DCE8E2] text-xs text-[#173327] space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Important Move-In Instructions</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
            <li>Present this digital receipt or reference code ({receipt.bookingReference}) at the property gate.</li>
            <li>Carry your original government photo ID and college admission/ID card for physical register entry.</li>
            <li>Standard check-in hours are 9:00 AM to 7:00 PM on your scheduled move-in date.</li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-[#ECE8DD] text-center text-[10px] text-slate-400">
          This is an electronically generated receipt verified by Apna Ghar Platform Operations. No physical signature is required.
        </div>
      </div>
    </div>
  );
}
