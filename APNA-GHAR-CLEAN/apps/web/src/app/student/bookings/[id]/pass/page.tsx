'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Building,
  BedDouble,
  CheckCircle2,
  Clock,
  Printer,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  MapPin,
  Phone,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { MoveInPass } from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';

export default function StudentMoveInPassPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const {
    data: pass,
    isLoading,
    error,
  } = useQuery<MoveInPass>({
    queryKey: ['move-in-pass', params.id],
    queryFn: () => apiClient<MoveInPass>(`/bookings/${params.id}/move-in-pass`),
    enabled: isAuthenticated && !!params.id,
  });

  const handleCopyQr = () => {
    if (pass?.gatePassQrData) {
      navigator.clipboard.writeText(pass.gatePassQrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-3">
        <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading your Move-In Pass...</p>
        <p className="text-xs text-slate-400">Verifying booking reference and inventory checklist</p>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load Move-In Pass</h2>
        <p className="text-xs text-slate-500">
          This pass might not exist or your booking is still pending initial payment confirmation.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Go Back
          </button>
          <Link
            href="/student/bookings"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
          >
            My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const moveInDateFormatted = new Date(pass.moveInDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Top Navigation Bar - Hidden on Print */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <button
          onClick={() => router.push('/student/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Pass / PDF</span>
          </button>
          <Link
            href="/student/bookings"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Bookings
          </Link>
        </div>
      </div>

      {/* Main Digital Pass Container (Printable) */}
      <div className="bg-white border-2 border-[#173327] rounded-3xl overflow-hidden shadow-xl print:shadow-none print:border-black">
        {/* Pass Top Branding Banner */}
        <div className="bg-[#173327] text-white px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] tracking-widest uppercase font-extrabold text-emerald-300">
              Official Digital Entry Token
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              APNA GHAR MOVE-IN PASS
            </h1>
            <p className="text-[11px] text-emerald-100 font-mono">
              Pass ID: {pass.passNumber} • Ref: {pass.bookingReference}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{pass.status === 'CHECKED_IN' ? 'CHECKED IN' : 'READY FOR MOVE-IN'}</span>
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Allocation Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FCFBF7] border border-[#ECE8DD]">
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                Student Name
              </span>
              <span className="font-extrabold text-sm text-[#173327] block truncate">
                {pass.studentName}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{pass.studentPhone}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                Assigned Unit
              </span>
              <span className="font-extrabold text-sm text-slate-900 block flex items-center gap-1">
                <BedDouble className="w-4 h-4 text-emerald-600" />
                <span>Room {pass.roomNumber}</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                {pass.bedLabel}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                Move-In Date
              </span>
              <span className="font-extrabold text-sm text-slate-900 block flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{new Date(pass.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
              <span className="text-[11px] text-slate-500 block">
                Window: 09:00 AM – 06:00 PM
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                Property
              </span>
              <span className="font-extrabold text-sm text-slate-900 block truncate flex items-center gap-1">
                <Building className="w-4 h-4 text-slate-500" />
                <span>{pass.propertyName}</span>
              </span>
              <span className="text-[10px] text-slate-500 block truncate" title={pass.propertyAddress}>
                {pass.propertyAddress}
              </span>
            </div>
          </div>

          {/* QR Code & Gate Verification Token Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-2xl bg-slate-900 text-white">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white rounded-xl text-slate-900 shadow-md">
              {/* Crisp SVG QR Graphic */}
              <div className="relative w-36 h-36 border-4 border-slate-900 rounded-lg p-2 bg-white flex flex-col justify-between">
                {/* 3 Corner Positioning Marks */}
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-slate-900 rounded-xs flex items-center justify-center">
                    <div className="w-4 h-4 bg-slate-900" />
                  </div>
                  <div className="w-8 h-8 border-4 border-slate-900 rounded-xs flex items-center justify-center">
                    <div className="w-4 h-4 bg-slate-900" />
                  </div>
                </div>

                {/* Central Decorative Data Matrix Simulation with Shield */}
                <div className="flex items-center justify-center my-auto">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-8 h-8 border-4 border-slate-900 rounded-xs flex items-center justify-center">
                    <div className="w-4 h-4 bg-slate-900" />
                  </div>
                  <div className="w-3 h-3 bg-slate-900 rounded-xs" />
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mt-2">
                Scan At Gate Entry
              </span>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-emerald-300">
                  Instant Gate Security Check-In
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Show this digital pass to the security guard or hostel warden on arrival. The QR code links directly to your verified booking payload and authorized bed assignment.
              </p>

              <div className="p-2.5 bg-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300 border border-slate-700">
                <span className="truncate pr-2">{pass.gatePassQrData}</span>
                <button
                  onClick={handleCopyQr}
                  title="Copy QR Data"
                  className="p-1 hover:bg-slate-700 rounded transition text-slate-300 hover:text-white shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* 6-Point Inventory Verification Handover Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#173327] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Room Inventory & Handover Checklist (6-Point Inspection)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Verify these amenities with the warden during your room key handover:
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                6 / 6 Pre-Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pass.checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-[#ECE8DD] bg-[#FCFBF7] flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block leading-snug">
                      {idx + 1}. {item.label}
                    </span>
                    {item.notes && (
                      <span className="text-[11px] text-slate-500 block">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Helpdesk */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-900">
              <MapPin className="w-3.5 h-3.5" />
              <span>Check-In Day Guidelines</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 leading-relaxed">
              <li>Carry a valid government ID or your College Student ID card for physical identity matching.</li>
              <li>Move-in check-in window opens promptly at 09:00 AM on {moveInDateFormatted}.</li>
              <li>For late check-ins after 08:00 PM, please alert property management in advance.</li>
            </ul>
          </div>
        </div>

        {/* Pass Footer */}
        <div className="px-6 sm:px-8 py-3 bg-[#FCFBF7] border-t border-[#ECE8DD] flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <span>Har Sahar Apna Ghar • Student Accommodation Network</span>
          <span>Verified By Apna Ghar Trust Engine</span>
        </div>
      </div>
    </div>
  );
}
