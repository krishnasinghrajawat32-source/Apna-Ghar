'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, ApiError } from '@/lib/api-client';
import { HoldResponse } from '@apna-ghar/shared-types';

export interface ActiveHoldMeta {
  holdId: string;
  bedId: string;
  bedLabel?: string;
  roomNumber?: string;
  roomTypeName?: string;
  baseRent?: number;
  propertyName?: string;
  propertySlug?: string;
  propertyId?: string;
  expiresAt: string;
  ttlSecondsRemaining: number;
}

interface BedHoldState {
  activeHold: ActiveHoldMeta | null;
  isLoading: boolean;
  error: string | null;

  setHold: (hold: ActiveHoldMeta) => void;
  clearHold: () => void;
  decrementTtl: () => void;
  holdBed: (
    bedId: string,
    meta?: Partial<ActiveHoldMeta>,
  ) => Promise<{ success: boolean; error?: string }>;
  releaseHold: () => Promise<void>;
  syncActiveHold: () => Promise<void>;
}

export const useBedHoldStore = create<BedHoldState>()(
  persist(
    (set, get) => ({
      activeHold: null,
      isLoading: false,
      error: null,

      setHold: (hold: ActiveHoldMeta) => set({ activeHold: hold, error: null }),

      clearHold: () => set({ activeHold: null, error: null }),

      decrementTtl: () => {
        const current = get().activeHold;
        if (!current) return;

        if (current.ttlSecondsRemaining <= 1) {
          set({ activeHold: null, error: 'Your bed reservation hold has expired.' });
        } else {
          set({
            activeHold: {
              ...current,
              ttlSecondsRemaining: current.ttlSecondsRemaining - 1,
            },
          });
        }
      },

      holdBed: async (bedId: string, meta = {}) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiClient<HoldResponse>(`/inventory/beds/${bedId}/hold`, {
            method: 'POST',
            body: JSON.stringify({ ttlSeconds: 480 }),
          });

          const holdMeta: ActiveHoldMeta = {
            holdId: res.holdId,
            bedId: res.bedId,
            expiresAt: res.expiresAt,
            ttlSecondsRemaining: res.ttlSecondsRemaining,
            bedLabel: meta.bedLabel,
            roomNumber: meta.roomNumber,
            roomTypeName: meta.roomTypeName,
            baseRent: meta.baseRent,
            propertyName: meta.propertyName,
            propertySlug: meta.propertySlug,
            propertyId: meta.propertyId,
          };

          set({ activeHold: holdMeta, isLoading: false, error: null });
          return { success: true };
        } catch (err: unknown) {
          let message = 'Unable to reserve bed. Please try again.';
          if (err instanceof ApiError) {
            message = err.message;
          } else if (err instanceof Error) {
            message = err.message;
          }
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      releaseHold: async () => {
        const current = get().activeHold;
        if (!current) return;

        set({ isLoading: true });
        try {
          await apiClient(`/inventory/beds/${current.bedId}/hold`, {
            method: 'DELETE',
          });
        } catch {
          // Ignore network errors when clearing hold
        } finally {
          set({ activeHold: null, isLoading: false, error: null });
        }
      },

      syncActiveHold: async () => {
        try {
          const res = await apiClient<{
            bed: {
              id: string;
              bedLabel: string;
              propertyId: { id?: string; _id?: string; name?: string; slug?: string };
              roomId: { roomNumber?: string };
              roomTypeId: { name?: string; baseRent?: number };
            };
            hold: {
              isHeld: boolean;
              heldByCurrentStudent: boolean;
              ttlRemaining: number;
              expiresAt: string;
            };
          } | null>('/inventory/user/active-hold');

          if (res && res.hold && res.hold.isHeld && res.hold.heldByCurrentStudent) {
            const propertyObj = res.bed.propertyId;
            set({
              activeHold: {
                holdId: 'active',
                bedId: res.bed.id,
                bedLabel: res.bed.bedLabel,
                roomNumber: res.bed.roomId?.roomNumber,
                roomTypeName: res.bed.roomTypeId?.name,
                baseRent: res.bed.roomTypeId?.baseRent,
                propertyName: propertyObj?.name,
                propertySlug: propertyObj?.slug,
                propertyId: propertyObj?.id || (propertyObj as unknown as { _id?: string })._id,
                expiresAt: res.hold.expiresAt,
                ttlSecondsRemaining: res.hold.ttlRemaining,
              },
              error: null,
            });
          } else {
            // No active hold on backend
            set({ activeHold: null });
          }
        } catch {
          // Unauthenticated or network error; keep existing local state if valid
        }
      },
    }),
    {
      name: 'apna_ghar_bed_hold',
      partialize: (state) => ({ activeHold: state.activeHold }),
    },
  ),
);
