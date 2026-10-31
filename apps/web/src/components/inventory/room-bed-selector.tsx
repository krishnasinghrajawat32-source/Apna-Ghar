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
      <div className="bg-white rounded-2xl border border-[#ECE8DD] p-6 shadow-xs flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
        <span className="text-xs text-[#3D3A33] font-medium">Loading real-time room & bed availability...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ECE8DD] p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#ECE8DD]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#173327]">Choose Your Exact Bed</h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Zero Double-Booking
            </span>
          </div>
          <p className="text-xs text-[#3D3A33]">
            Select your preferred bed to lock in an 8-minute reservation hold while completing checkout.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-500">
          No physical rooms or beds currently configured for this property.
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border border-[#ECE8DD] rounded-xl p-4 bg-[#FCFBF7] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#173327]">
                    Room {room.roomNumber}
                  </span>
                  {room.roomTypeName && (
                    <span className="text-[11px] text-gray-500">({room.roomTypeName})</span>
                  )}
                  <span className="text-[10px] bg-white border border-[#ECE8DD] px-1.5 py-0.5 rounded text-gray-600">
                    Floor {room.floor}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#173327]">
                  {formatCurrency(room.baseRent)} <span className="text-[10px] text-gray-500 font-normal">/ mo</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isMyHold
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500'
                          : isAvailable
                          ? 'border-[#ECE8DD] bg-white text-[#173327] hover:border-emerald-600 hover:shadow-xs cursor-pointer'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <BedDouble className="w-4 h-4 text-emerald-700" />
                        {isOccupied && <Lock className="w-3 h-3 text-gray-400" />}
                        {isHeld && !isMyHold && (
                          <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-1 rounded">
                            Held
                          </span>
                        )}
                        {isMyHold && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold">Bed {bed.bedNumber}</span>
                      <span className="text-[10px] text-gray-500">
                        {isMyHold ? 'Held by you' : isOccupied ? 'Occupied' : isHeld ? 'Temporarily held' : 'Available'}
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
