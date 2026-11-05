'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { BedDouble, CheckCircle2, Lock, AlertCircle, Loader2 } from 'lucide-react';
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
  rooms: RoomInventoryItem[];
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
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: inventory, isLoading, refetch } = useQuery<InventoryResponse>({
    queryKey: ['property-inventory', propertyId],
    queryFn: () => apiClient<InventoryResponse>(`/inventory/properties/${propertyId}`),
    enabled: !!propertyId,
    refetchInterval: 15000, // Refresh every 15s to update real-time holds
  });

  const rooms = inventory?.rooms || [];

  const handleSelectBed = async (bed: BedInventoryItem, room: RoomInventoryItem) => {
    if (bed.status !== 'AVAILABLE') return;
    setErrorMessage(null);
    setSelectedBedId(bed.id);

    if (!isAuthenticated) {
      router.push(`/login?redirect=/property/${propertySlug}`);
      return;
    }

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
      setErrorMessage(result.error || 'Failed to hold bed. Please try again.');
    } else {
      refetch();
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
            Select your preferred bed to lock in an 8-minute reservation hold while completing checkout.
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
                  const isHeld = bed.status === 'HELD';
                  const isOccupied = bed.status === 'OCCUPIED';
                  const isAvailable = bed.status === 'AVAILABLE';
                  const isMyHold = activeHold?.bedId === bed.id || bed.isHeldByMe || (selectedBedId === bed.id && isAvailable);

                  return (
                    <button
                      key={bed.id}
                      type="button"
                      disabled={!isAvailable || isHolding}
                      onClick={() => handleSelectBed(bed, room)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isMyHold
                          ? 'border-[#F5A623] bg-[#F5A623]/15 text-[#102B50] ring-2 ring-[#F5A623] shadow-sm'
                          : isAvailable
                          ? 'border-[#E8E5DE] bg-white text-[#102B50] hover:border-[#102B50] hover:shadow-brand-sm cursor-pointer'
                          : 'border-[#E8E5DE]/60 bg-[#E8E5DE]/30 text-[#687586]/60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <BedDouble className={`w-4 h-4 ${isMyHold ? 'text-[#102B50]' : isAvailable ? 'text-[#102B50]' : 'text-[#687586]'}`} />
                        {isOccupied && <Lock className="w-3.5 h-3.5 text-[#687586]" />}
                        {isHeld && !isMyHold && (
                          <span className="text-[9px] font-black uppercase text-[#F5A623] bg-[#F5A623]/15 px-1.5 py-0.5 rounded">
                            Held
                          </span>
                        )}
                        {isMyHold && (
                          <CheckCircle2 className="w-4 h-4 text-[#21865B]" />
                        )}
                      </div>
                      <span className="text-xs font-black">Bed {bed.bedNumber}</span>
                      <span className="text-[10px] text-[#687586] font-semibold mt-0.5">
                        {isMyHold ? 'Locked by you' : isOccupied ? 'Occupied' : isHeld ? 'Temporarily held' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
