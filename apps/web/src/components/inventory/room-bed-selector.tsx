'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { BedDouble, CheckCircle2, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useBedHoldStore } from '@/features/inventory/bed-hold-store';
import { useAuthStore } from '@/features/auth/auth-store';

interface BedInventoryItem {
  id: string;
  bedNumber: string;
  label?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'HELD';
  isHeldByMe?: boolean;
}

interface RoomInventoryItem {
  id: string;
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  roomTypeName?: string;
  baseRent: number;
  deposit: number;
  beds: BedInventoryItem[];
}

interface InventoryResponse {
  propertyId: string;
  totalBeds: number;
  availableBeds: number;
  rooms?: RoomInventoryItem[];
  inventory?: Array<{
    roomType: {
      id?: string;
      _id?: string;
      name?: string;
      baseRent?: number;
      deposit?: number;
      sharingType?: string;
    };
    availableBedsCount?: number;
    totalBedsCount?: number;
    rooms?: Array<{
      room: {
        id?: string;
        _id?: string;
        roomNumber?: string;
        floorNumber?: number;
        floor?: number;
        roomTypeId?: string;
      };
      beds?: Array<{
        id?: string;
        _id?: string;
        bedLabel?: string;
        bedNumber?: string;
        permanentStatus?: string;
        dynamicStatus?: string;
      }>;
    }>;
  }>;
}

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
  const { holdBed, activeHold, isLoading: isHolding } = useBedHoldStore();
  const [selectedBed, setSelectedBed] = useState<{ bed: BedInventoryItem; room: RoomInventoryItem } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: inventory, isLoading, refetch } = useQuery<InventoryResponse>({
    queryKey: ['property-inventory', propertyId],
    queryFn: () => apiClient<InventoryResponse>(`/inventory/properties/${propertyId}`),
    enabled: !!propertyId,
    refetchInterval: 15000, // Refresh every 15s to update real-time holds
  });

  // Extract rooms cleanly from either top-level rooms or nested inventory response
  const rooms: RoomInventoryItem[] = useMemo(() => {
    if (!inventory) return [];
    if (inventory.rooms && Array.isArray(inventory.rooms) && inventory.rooms.length > 0) {
      return inventory.rooms;
    }
    const rawInv = inventory.inventory;
    if (rawInv && Array.isArray(rawInv)) {
      const extracted: RoomInventoryItem[] = [];
      for (const rtItem of rawInv) {
        const rt = rtItem.roomType || {};
        const rtRooms = rtItem.rooms || [];
        for (const rObj of rtRooms) {
          const room = rObj.room || {};
          const beds = rObj.beds || [];
          extracted.push({
            id: String(room.id || room._id || Math.random().toString()),
            roomNumber: room.roomNumber || 'Room',
            floor: room.floorNumber ?? room.floor ?? 1,
            roomTypeId: String(room.roomTypeId || rt.id || rt._id || ''),
            roomTypeName: rt.name || 'Standard Room',
            baseRent: rt.baseRent || 0,
            deposit: rt.deposit || 0,
            beds: beds.map((b) => {
              let status: 'AVAILABLE' | 'OCCUPIED' | 'HELD' = 'AVAILABLE';
              if (
                b.dynamicStatus === 'OCCUPIED' ||
                b.dynamicStatus === 'MAINTENANCE' ||
                b.permanentStatus === 'BOOKED' ||
                b.permanentStatus === 'OCCUPIED'
              ) {
                status = 'OCCUPIED';
              } else if (b.dynamicStatus === 'HELD_BY_OTHER' || b.dynamicStatus === 'HELD_BY_YOU') {
                status = 'HELD';
              }
              return {
                id: String(b.id || b._id || Math.random().toString()),
                bedNumber: b.bedLabel || b.bedNumber || 'Bed',
                label: b.bedLabel,
                status,
                isHeldByMe: b.dynamicStatus === 'HELD_BY_YOU',
              };
            }),
          });
        }
      }
      return extracted;
    }
    return [];
  }, [inventory]);

  // Sync active hold with selectedBed if already held
  useEffect(() => {
    if (activeHold && rooms.length > 0 && !selectedBed) {
      for (const r of rooms) {
        const matchingBed = r.beds.find((b) => b.id === activeHold.bedId);
        if (matchingBed) {
          setSelectedBed({ bed: matchingBed, room: r });
          break;
        }
      }
    }
  }, [activeHold, rooms, selectedBed]);

  const handleSelectBed = (bed: BedInventoryItem, room: RoomInventoryItem) => {
    if (bed.status !== 'AVAILABLE' && !bed.isHeldByMe && activeHold?.bedId !== bed.id) return;
    setErrorMessage(null);
    setSelectedBed({ bed, room });
  };

  const handleBookNow = async (bed: BedInventoryItem, room: RoomInventoryItem) => {
    setErrorMessage(null);

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/property/${propertySlug}#room-bed-selection`)}`);
      return;
    }

    setIsRedirecting(true);
    const result = await holdBed(bed.id, {
      bedId: bed.id,
      bedLabel: `Bed ${bed.bedNumber} (Room ${room.roomNumber})`,
      roomNumber: room.roomNumber,
      roomTypeName: room.roomTypeName,
      baseRent: room.baseRent,
      propertyId,
      propertyName,
      propertySlug,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to hold bed. Please try another bed or refresh.');
      setIsRedirecting(false);
      refetch();
    } else {
      router.push(`/booking/checkout?bedId=${bed.id}&propertyId=${propertyId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8E5DE] p-8 shadow-brand-sm flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-[#102B50] animate-spin" />
        <span className="text-xs text-[#263445] font-semibold">Loading real-time room & bed availability...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E8E5DE] p-6 sm:p-8 shadow-brand-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E5DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#102B50]">Choose Your Exact Bed</h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
              Zero Double-Booking
            </span>
          </div>
          <p className="text-xs text-[#687586]">
            Select your preferred bed to lock in an 8-minute reservation hold and proceed to book with sample payment.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-[#D64545]/10 border border-[#D64545]/30 text-xs text-[#D64545] font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-10 text-xs text-[#687586] font-medium">
          No physical rooms or beds currently configured for this property.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border border-[#E8E5DE] rounded-2xl p-5 bg-[#FAF8F3] space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#102B50]">
                      Room {room.roomNumber}
                    </span>
                    {room.roomTypeName && (
                      <span className="text-[11px] text-[#687586] font-medium">({room.roomTypeName})</span>
                    )}
                    <span className="text-[10px] font-bold bg-white border border-[#E8E5DE] px-2 py-0.5 rounded text-[#263445]">
                      Floor {room.floor}
                    </span>
                  </div>
                  <span className="text-xs font-black text-[#102B50]">
                    {formatCurrency(room.baseRent)} <span className="text-[10px] text-[#687586] font-medium">/ mo</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {room.beds.map((bed) => {
                    const isOccupied = bed.status === 'OCCUPIED';
                    const isAvailable = bed.status === 'AVAILABLE';
                    const isMyHold = activeHold?.bedId === bed.id || bed.isHeldByMe;
                    const isSelected = selectedBed?.bed.id === bed.id;

                    const canSelect = isAvailable || isMyHold;

                    return (
                      <button
                        key={bed.id}
                        type="button"
                        disabled={!canSelect || isHolding || isRedirecting}
                        onClick={() => handleSelectBed(bed, room)}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected || isMyHold
                            ? 'border-[#F5A623] bg-[#F5A623]/15 text-[#102B50] ring-2 ring-[#F5A623] shadow-sm'
                            : isAvailable
                            ? 'border-[#E8E5DE] bg-white text-[#102B50] hover:border-[#102B50] hover:shadow-brand-sm cursor-pointer'
                            : 'border-[#E8E5DE]/60 bg-[#E8E5DE]/30 text-[#687586]/60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <BedDouble className={`w-4 h-4 ${isSelected || isMyHold ? 'text-[#102B50]' : isAvailable ? 'text-[#102B50]' : 'text-[#687586]'}`} />
                          {isOccupied && <Lock className="w-3.5 h-3.5 text-[#687586]" />}
                          {bed.status === 'HELD' && !isMyHold && (
                            <span className="text-[9px] font-black uppercase text-[#F5A623] bg-[#F5A623]/15 px-1.5 py-0.5 rounded">
                              Held
                            </span>
                          )}
                          {(isSelected || isMyHold) && (
                            <CheckCircle2 className="w-4 h-4 text-[#21865B]" />
                          )}
                        </div>
                        <span className="text-xs font-black">Bed {bed.bedNumber}</span>
                        <span className="text-[10px] text-[#687586] font-semibold mt-0.5">
                          {isMyHold ? 'Locked by you' : isSelected ? 'Selected' : isOccupied ? 'Occupied' : bed.status === 'HELD' ? 'Temporarily held' : 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Prominent Selected Bed & Book Room Call-To-Action Card */}
          {selectedBed ? (
            <div className="p-5 rounded-2xl bg-[#F0F4F8] border border-[#102B50]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#21865B]" />
                  <span className="text-xs font-black text-[#102B50] uppercase tracking-wider">
                    Ready to Book
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B]">
                    Guaranteed Rate
                  </span>
                </div>
                <div className="text-base font-black text-[#102B50]">
                  Room {selectedBed.room.roomNumber} • Bed {selectedBed.bed.bedNumber}
                  {selectedBed.room.roomTypeName && (
                    <span className="text-xs font-bold text-[#687586] ml-2">
                      ({selectedBed.room.roomTypeName})
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#263445]">
                  <span className="font-extrabold text-[#102B50] text-sm">{formatCurrency(selectedBed.room.baseRent)}</span> / month
                  <span className="text-[#687586] mx-2">•</span>
                  <span>Refundable Deposit: {formatCurrency(selectedBed.room.deposit)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isHolding || isRedirecting}
                onClick={() => handleBookNow(selectedBed.bed, selectedBed.room)}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl text-xs sm:text-sm font-extrabold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isHolding || isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#102B50]" />
                    <span>Securing Bed Hold...</span>
                  </>
                ) : (
                  <>
                    <span>Book Room (Proceed to Payment)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] text-center text-xs text-[#687586] font-medium">
              Click any available bed above to select your room and proceed to book.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
