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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 text-white shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Bed Information */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <BedDouble className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">
                {activeHold.bedLabel || 'Selected Bed'}
              </span>
              {activeHold.roomNumber && (
                <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                  Room {activeHold.roomNumber}
                </span>
              )}
              {activeHold.roomTypeName && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {activeHold.roomTypeName}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Temporarily locked in Redis for you — cannot be reserved by others</span>
            </div>
          </div>
        </div>

        {/* Right: Countdown & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Countdown timer badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-mono font-medium ${
              isExpiringSoon
                ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => releaseHold()}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Release this bed hold early"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Release</span>
            </button>

            <Link
              href={
                activeHold.propertySlug
                  ? `/property/${activeHold.propertySlug}`
                  : '#'
              }
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition"
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
