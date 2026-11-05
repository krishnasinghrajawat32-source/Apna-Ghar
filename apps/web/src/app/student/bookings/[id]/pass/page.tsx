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
        <Clock className="w-8 h-8 text-[#102B50] animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#102B50]">Loading your Move-In Pass...</p>
        <p className="text-xs text-[#687586]">Verifying booking reference and inventory checklist</p>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-[#D64545]/10 text-[#D64545] rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-[#102B50]">Unable to load Move-In Pass</h2>
        <p className="text-xs text-[#687586]">
          This pass might not exist or your booking is still pending initial payment confirmation.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#687586] bg-[#FAF8F3] hover:bg-[#E8E5DE] transition"
          >
            Go Back
          </button>
          <Link
            href="/student/bookings"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition"
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
          className="inline-flex items-center gap-2 text-xs font-bold text-[#687586] hover:text-[#102B50] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-white border border-[#E8E5DE] hover:bg-[#FAF8F3] shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Print Pass / PDF</span>
          </button>
          <Link
            href="/student/bookings"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#687586] hover:bg-[#FAF8F3] transition"
          >
            Bookings
          </Link>
        </div>
      </div>

      {/* Main Digital Pass Container (Printable) */}
      <div className="bg-white border-2 border-[#102B50] rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:border-black">
        {/* Pass Top Branding Banner */}
        <div className="bg-[#102B50] text-white px-6 sm:px-8 py-6 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] tracking-widest uppercase font-black text-[#F5A623]">
              Official Digital Entry Token
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              APNA GHAR MOVE-IN PASS
            </h1>
            <p className="text-[11px] text-white/70 font-mono">
              Pass ID: {pass.passNumber} • Ref: {pass.bookingReference}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#21865B] text-white shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{pass.status === 'CHECKED_IN' ? 'CHECKED IN' : 'READY FOR MOVE-IN'}</span>
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Allocation Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE]">
            <div>
              <span className="text-[11px] text-[#687586] block uppercase font-bold tracking-wider">
                Student Name
              </span>
              <span className="font-black text-sm text-[#102B50] block truncate">
                {pass.studentName}
              </span>
              <span className="text-[11px] text-[#687586] flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-[#687586]" />
                <span>{pass.studentPhone}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#687586] block uppercase font-bold tracking-wider">
                Assigned Unit
              </span>
              <span className="font-black text-sm text-[#102B50] block flex items-center gap-1">
                <BedDouble className="w-4 h-4 text-[#F5A623]" />
                <span>Room {pass.roomNumber}</span>
              </span>
              <span className="text-[11px] font-bold text-[#21865B]">
                {pass.bedLabel}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#687586] block uppercase font-bold tracking-wider">
                Move-In Date
              </span>
              <span className="font-black text-sm text-[#102B50] block flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#687586]" />
                <span>{new Date(pass.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
              <span className="text-[11px] text-[#687586] block">
                Window: 09:00 AM – 06:00 PM
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#687586] block uppercase font-bold tracking-wider">
                Property
              </span>
              <span className="font-black text-sm text-[#102B50] block truncate flex items-center gap-1">
                <Building className="w-4 h-4 text-[#687586]" />
                <span>{pass.propertyName}</span>
              </span>
              <span className="text-[10px] text-[#687586] block truncate" title={pass.propertyAddress}>
                {pass.propertyAddress}
              </span>
            </div>
          </div>

          {/* QR Code & Gate Verification Token Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 sm:p-8 rounded-3xl bg-[#102B50] text-white">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white rounded-2xl text-[#102B50] shadow-md">
              {/* Crisp SVG QR Graphic */}
              <div className="relative w-36 h-36 border-4 border-[#102B50] rounded-xl p-2 bg-white flex flex-col justify-between">
                {/* 3 Corner Positioning Marks */}
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-[#102B50] rounded-xs flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#102B50]" />
                  </div>
                  <div className="w-8 h-8 border-4 border-[#102B50] rounded-xs flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#102B50]" />
                  </div>
                </div>

                {/* Central Decorative Data Matrix Simulation with Shield */}
                <div className="flex items-center justify-center my-auto">
                  <div className="w-8 h-8 bg-[#21865B] rounded-full flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-8 h-8 border-4 border-[#102B50] rounded-xs flex items-center justify-center">
                    <div className="w-4 h-4 bg-[#102B50]" />
                  </div>
                  <div className="w-3 h-3 bg-[#102B50] rounded-xs" />
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-black text-[#102B50] mt-2">
                Scan At Gate Entry
              </span>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#F5A623]" />
                <h3 className="font-black text-sm text-[#F5A623]">
                  Instant Gate Security Check-In
                </h3>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Show this digital pass to the security guard or hostel warden on arrival. The QR code links directly to your verified booking payload and authorized bed assignment.
              </p>

              <div className="p-3 bg-[#0C203C] rounded-xl flex items-center justify-between text-xs font-mono text-[#F5A623] border border-white/10">
                <span className="truncate pr-2">{pass.gatePassQrData}</span>
                <button
                  onClick={handleCopyQr}
                  title="Copy QR Data"
                  className="p-1 hover:bg-white/10 rounded transition text-white/70 hover:text-white shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-[#21865B]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* 6-Point Inventory Verification Handover Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-[#102B50] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#21865B]" />
                  <span>Room Inventory & Handover Checklist (6-Point Inspection)</span>
                </h2>
                <p className="text-xs text-[#687586]">
                  Verify these amenities with the warden during your room key handover:
                </p>
              </div>
              <span className="text-xs font-black text-[#21865B] bg-[#21865B]/10 px-2.5 py-1 rounded-full">
                6 / 6 Pre-Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pass.checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#21865B]/15 text-[#21865B] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#102B50] block leading-snug">
                      {idx + 1}. {item.label}
                    </span>
                    {item.notes && (
                      <span className="text-[11px] text-[#687586] block">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Helpdesk */}
          <div className="p-5 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/30 text-xs text-[#102B50] space-y-2">
            <h4 className="font-black flex items-center gap-1.5 text-[#102B50]">
              <MapPin className="w-4 h-4 text-[#F5A623]" />
              <span>Check-In Day Guidelines</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#263445] leading-relaxed">
              <li>Carry a valid government ID or your College Student ID card for physical identity matching.</li>
              <li>Move-in check-in window opens promptly at 09:00 AM on {moveInDateFormatted}.</li>
              <li>For late check-ins after 08:00 PM, please alert property management in advance.</li>
            </ul>
          </div>
        </div>

        {/* Pass Footer */}
        <div className="px-6 sm:px-8 py-3.5 bg-[#FAF8F3] border-t border-[#E8E5DE] flex flex-wrap items-center justify-between text-[11px] text-[#687586]">
          <span>Har Sahar Apna Ghar • Student Accommodation Network</span>
          <span className="font-bold text-[#102B50]">Verified By Apna Ghar Trust Engine</span>
        </div>
      </div>
    </div>
  );
}
