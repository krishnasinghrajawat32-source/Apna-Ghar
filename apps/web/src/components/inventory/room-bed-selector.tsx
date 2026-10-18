'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bed as BedIcon,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Compass,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { PropertyInventoryResponse, Bed } from '@apna-ghar/shared-types';
import { apiClient } from '@/lib/api-client';
import { useBedHoldStore } from '@/features/inventory/bed-hold-store';
import { useAuthStore } from '@/features/auth/auth-store';

interface RoomBedSelectorProps {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
}

export function RoomBedSelector({
  propertyId,
  propertyName,
  propertySlug,
}: RoomBedSelectorProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { activeHold, holdBed, releaseHold, isLoading: isHolding } = useBedHoldStore();

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: inventoryData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['property-inventory', propertyId],
    queryFn: () => apiClient<PropertyInventoryResponse>(`/inventory/properties/${propertyId}`),
    refetchInterval: 12000, // Poll every 12 seconds for live bed availability
  });

  const inventory = inventoryData?.inventory ?? [];
  const currentRoomType =
    inventory.find((rt) => rt.roomType.id === selectedRoomTypeId) ||
    inventory[0] ||
    null;

  const currentRooms = currentRoomType?.rooms ?? [];
  const currentRoom =
    currentRooms.find((r) => r.room.id === selectedRoomId) ||
    currentRooms[0] ||
    null;

  const handleSelectBed = (bed: Bed) => {
    setErrorMessage(null);
    if (bed.dynamicStatus === 'OCCUPIED' || bed.dynamicStatus === 'MAINTENANCE') {
      return;
    }
    if (bed.dynamicStatus === 'HELD_BY_OTHER') {
      setErrorMessage(
        'This bed is currently locked by another student. Please select an available bed or check back soon.',
      );
      return;
    }
    setSelectedBed(bed);
  };

  const handleConfirmHold = async () => {
    if (!selectedBed) return;
    setErrorMessage(null);

    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/property/${propertySlug}`);
      return;
    }

    const result = await holdBed(selectedBed.id, {
      bedLabel: selectedBed.bedLabel,
      roomNumber: currentRoom?.room.roomNumber,
      roomTypeName: currentRoomType?.roomType.name,
      baseRent: currentRoomType?.roomType.baseRent,
      propertyName,
      propertySlug,
      propertyId,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to reserve bed. Please try again.');
    }

    // Refresh inventory data to reflect newly acquired hold
    refetch();
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading live room & bed availability...
        </p>
      </div>
    );
  }

  // Lock 4 Compliant: Empty state when no inventory exists in database
  if (!inventory || inventory.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
        <BedIcon className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          No Rooms or Beds Configured Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          The property owner has not published room inventory. Please schedule a physical visit to check availability.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <BedIcon className="w-5 h-5 text-emerald-500" />
              <span>Select Room & Exact Bed</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Redis Lock
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose your preferred bed and reserve it with a guaranteed 8-minute temporary hold.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition shadow-xs"
          title="Refresh bed availability"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error / Conflict Alert */}
      {errorMessage && (
        <div className="m-4 sm:m-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <p className="font-semibold">Reservation Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-6">
        {/* Step 1: Select Room Type */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
            1. Select Sharing Option
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inventory.map((item) => {
              const isSelected =
                (selectedRoomTypeId || inventory[0]?.roomType.id) === item.roomType.id;
              return (
                <button
                  key={item.roomType.id}
                  onClick={() => {
                    setSelectedRoomTypeId(item.roomType.id);
                    setSelectedBed(null);
                    setErrorMessage(null);
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {item.roomType.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      ₹{item.roomType.baseRent.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {item.availableBedsCount} of {item.totalBedsCount} beds free
                    </span>
                    {item.roomType.ac && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                        AC
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Room (if multiple rooms exist) */}
        {currentRooms.length > 1 && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              2. Select Room
            </label>
            <div className="flex flex-wrap gap-2">
              {currentRooms.map((r) => {
                const isSelected =
                  (selectedRoomId || currentRooms[0]?.room.id) === r.room.id;
                const freeBeds = r.beds.filter(
                  (b) => b.dynamicStatus === 'AVAILABLE' || b.dynamicStatus === 'HELD_BY_YOU',
                ).length;

                return (
                  <button
                    key={r.room.id}
                    onClick={() => {
                      setSelectedRoomId(r.room.id);
                      setSelectedBed(null);
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Room {r.room.roomNumber} ({freeBeds} free)
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Exact Bed Selection Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Choose Your Exact Bed
            </label>
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Held
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                Occupied
              </span>
            </div>
          </div>

          {currentRoom && currentRoom.beds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentRoom.beds.map((bed) => {
                const isHeldByMe =
                  bed.dynamicStatus === 'HELD_BY_YOU' ||
                  activeHold?.bedId === bed.id;
                const isHeldByOther = bed.dynamicStatus === 'HELD_BY_OTHER';
                const isOccupied =
                  bed.dynamicStatus === 'OCCUPIED' || bed.dynamicStatus === 'MAINTENANCE';
                const isSelected = selectedBed?.id === bed.id || isHeldByMe;

                return (
                  <div
                    key={bed.id}
                    onClick={() => handleSelectBed(bed)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isOccupied
                        ? 'opacity-60 bg-slate-100/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : isHeldByOther
                        ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 cursor-not-allowed'
                        : isHeldByMe
                        ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/40 text-blue-900 dark:text-blue-100'
                        : isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isHeldByMe
                              ? 'bg-blue-500/20 text-blue-500'
                              : isHeldByOther
                              ? 'bg-amber-500/20 text-amber-500'
                              : isOccupied
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          <BedIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {bed.bedLabel}
                          </p>
                          {bed.position && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Compass className="w-2.5 h-2.5 text-slate-400" />
                              {bed.position} Bed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isHeldByMe ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500 text-white animate-pulse">
                          <UserCheck className="w-3 h-3" />
                          Held by You
                        </span>
                      ) : isHeldByOther ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          Held
                        </span>
                      ) : isOccupied ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          <Lock className="w-3 h-3" />
                          Occupied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Sparkles className="w-3 h-3" />
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              No beds found in this room.
            </p>
          )}
        </div>

        {/* Step 4: Action Drawer / Confirmation Panel */}
        {selectedBed && selectedBed.dynamicStatus === 'AVAILABLE' && (
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-emerald-400">
                  Ready to reserve {selectedBed.bedLabel}
                </span>
                <span className="text-xs text-slate-400">
                  (Room {currentRoom?.room.roomNumber})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Locks this bed for 8 minutes via Redis TTL so no other student can take it while you finalize booking.
              </p>
            </div>

            <button
              onClick={handleConfirmHold}
              disabled={isHolding}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition shrink-0"
            >
              <Clock className="w-4 h-4" />
              <span>{isHolding ? 'Reserving Lock...' : 'Hold Bed for 8 Mins'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* When bed is currently held by this student */}
        {activeHold && activeHold.ttlSecondsRemaining > 0 && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  {activeHold.bedLabel || 'Bed'} is locked for you
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Remaining lock window: {Math.floor(activeHold.ttlSecondsRemaining / 60)}m {activeHold.ttlSecondsRemaining % 60}s.
                </p>
              </div>
            </div>

            <button
              onClick={() => releaseHold()}
              disabled={isHolding}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Release bed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
