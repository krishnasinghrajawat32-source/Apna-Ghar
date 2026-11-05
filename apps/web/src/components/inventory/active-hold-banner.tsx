'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, XCircle, ArrowRight, BedDouble } from 'lucide-react';
import { useBedHoldStore } from '@/features/inventory/bed-hold-store';

export function ActiveHoldBanner() {
  const { activeHold, decrementTtl, releaseHold, isLoading, syncActiveHold } = useBedHoldStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    syncActiveHold();
  }, [syncActiveHold]);

  useEffect(() => {
    if (!activeHold) return;

    const interval = setInterval(() => {
      decrementTtl();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold, decrementTtl]);

  if (!isMounted || !activeHold || activeHold.ttlSecondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(activeHold.ttlSecondsRemaining / 60);
  const seconds = activeHold.ttlSecondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpiringSoon = activeHold.ttlSecondsRemaining < 120; // < 2 minutes

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-[#102B50]/95 backdrop-blur-md border-t border-[#183D68] text-white shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Bed Information */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623]">
            <BedDouble className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {activeHold.bedLabel || 'Selected Bed'}
              </span>
              {activeHold.roomNumber && (
                <span className="text-xs bg-[#0C203C] border border-white/10 px-2 py-0.5 rounded-full text-white/80">
                  Room {activeHold.roomNumber}
                </span>
              )}
              {activeHold.roomTypeName && (
                <span className="text-xs text-white/60 hidden sm:inline">
                  • {activeHold.roomTypeName}
                </span>
              )}
            </div>
            <div className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#21865B]" />
              <span>Temporarily locked in Redis for you — cannot be reserved by others</span>
            </div>
          </div>
        </div>

        {/* Right: Countdown & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Countdown timer badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${
              isExpiringSoon
                ? 'bg-[#D64545]/20 border-[#D64545] text-[#D64545] animate-pulse'
                : 'bg-[#F5A623]/15 border-[#F5A623]/40 text-[#F5A623]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => releaseHold()}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-[#0C203C] hover:bg-[#183D68] border border-white/10 transition"
              title="Release this bed hold early"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Release</span>
            </button>

            <Link
              href={
                activeHold.bedId
                  ? `/booking/checkout?bedId=${activeHold.bedId}`
                  : activeHold.propertySlug
                  ? `/property/${activeHold.propertySlug}`
                  : '#'
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] shadow-md transition-all active:scale-95"
            >
              <span>Review & Pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
