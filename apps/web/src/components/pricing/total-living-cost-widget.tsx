'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calculator,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { RoomType, TotalLivingCost, CostCategory } from '@apna-ghar/shared-types';

interface CostBreakdownData {
  propertyId: string;
  roomTypeId?: string;
  roomTypeName?: string;
  upfrontMoveInTotal: number;
  securityDeposit: number;
  depositRefundable: boolean;
  noticePeriodDays: number;
  totalLivingCost: TotalLivingCost;
}

interface TotalLivingCostWidgetProps {
  propertyId: string;
  roomTypes: RoomType[];
}

export function TotalLivingCostWidget({
  propertyId,
  roomTypes,
}: TotalLivingCostWidgetProps) {
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(
    roomTypes && roomTypes.length > 0 && roomTypes[0] ? roomTypes[0].id : '',
  );

  const { data, isLoading } = useQuery<CostBreakdownData>({
    queryKey: ['property-cost-breakdown', propertyId, selectedRoomTypeId],
    queryFn: () =>
      apiClient<CostBreakdownData>(
        `/properties/${propertyId}/cost-breakdown${
          selectedRoomTypeId ? `?roomTypeId=${selectedRoomTypeId}` : ''
        }`,
      ),
    enabled: !!propertyId,
  });

  const cost = data?.totalLivingCost;
  const upfrontTotal = data?.upfrontMoveInTotal || 0;
  const monthlyTotal = cost?.estimatedMonthlyTotal || 0;
  const deposit = data?.securityDeposit || 0;

  return (
    <div className="bg-white rounded-3xl border border-[#E8E5DE] p-6 sm:p-8 shadow-brand-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E8E5DE]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center shadow-sm">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#102B50]">
              Total Living Cost Transparency
            </h3>
            <p className="text-xs text-[#687586]">
              Zero hidden charges. Full upfront breakdown of what you will actually pay.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#21865B]" />
          Apna Ghar Price Lock
        </span>
      </div>

      {/* Room Type Selector */}
      {roomTypes.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#102B50]">
            Select Room Configuration:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {roomTypes.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => setSelectedRoomTypeId(rt.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border text-left transition-all ${
                  selectedRoomTypeId === rt.id
                    ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                    : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:border-[#F5A623]'
                }`}
              >
                <p className="truncate font-extrabold">{rt.name}</p>
                <p className={`text-[10px] ${selectedRoomTypeId === rt.id ? 'text-[#F5A623]' : 'text-[#687586]'}`}>
                  {formatCurrency(rt.baseRent)} / mo
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dual Highlights: Upfront Move-In vs Estimated Monthly Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upfront Move-In Total */}
        <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#687586]">
            1. Upfront Move-In Total
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#102B50]">
              {formatCurrency(upfrontTotal)}
            </span>
          </div>
          <p className="text-[11px] text-[#687586]">
            Includes 1st month rent + refundable deposit of {formatCurrency(deposit)}
          </p>
        </div>

        {/* Estimated Monthly Living Cost */}
        <div className="p-5 rounded-2xl bg-[#102B50]/5 border border-[#102B50]/15 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#102B50]">
            2. Estimated Monthly Living Total
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#102B50]">
              {formatCurrency(monthlyTotal)}
            </span>
            <span className="text-xs font-bold text-[#102B50]">/ mo</span>
          </div>
          <p className="text-[11px] text-[#687586]">
            Rent + sub-metered electricity + housekeeping + meals
          </p>
        </div>
      </div>

      {/* Itemized Line Items Breakdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#102B50]">
          <span>Itemized Living Cost Details</span>
          <span className="text-[10px] text-[#687586] font-semibold">Billed Frequency</span>
        </div>

        <div className="divide-y divide-[#E8E5DE] border border-[#E8E5DE] rounded-2xl overflow-hidden bg-white text-xs">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-[#687586] animate-pulse">
              Calculating transparent living costs...
            </div>
          ) : cost?.lineItems && cost.lineItems.length > 0 ? (
            cost.lineItems.map((item, index) => (
              <div
                key={index}
                className="p-4 flex items-center justify-between hover:bg-[#FAF8F3] transition-colors"
              >
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#102B50]">{item.name}</span>
                    {item.category === CostCategory.FIXED && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#102B50]/10 text-[#102B50]">
                        Fixed
                      </span>
                    )}
                    {item.category === CostCategory.ESTIMATED && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#F5A623]/20 text-[#102B50]">
                        Metered / Est.
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-[#687586] leading-tight">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-black text-[#102B50]">
                    {item.amount === 0 ? 'Included' : formatCurrency(item.amount)}
                  </span>
                  <p className="text-[10px] text-[#687586] capitalize">
                    {item.frequency.toLowerCase()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#687586]">
              No cost items configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Security Deposit Terms Callout */}
      <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[#263445]">
          <p className="font-bold text-[#102B50]">Deposit Protection Guarantee</p>
          <p className="text-[11px] text-[#687586] leading-relaxed">
            Security deposit of {formatCurrency(deposit)} is 100% refundable subject to a {data?.noticePeriodDays || 30}-day notice period.
            No deduction for ordinary wear and tear.
          </p>
        </div>
      </div>
    </div>
  );
}
