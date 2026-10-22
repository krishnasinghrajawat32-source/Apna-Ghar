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
    <div className="bg-white rounded-2xl border border-[#ECE8DD] p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#ECE8DD]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAEBDE] text-[#E06D3B] flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#173327]">
              Total Living Cost Transparency
            </h3>
            <p className="text-xs text-[#3D3A33]">
              Zero hidden charges. Full upfront breakdown of what you will actually pay.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCE8E2] text-[#173327] self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#173327]" />
          Apna Ghar Price Lock
        </span>
      </div>

      {/* Room Type Selector */}
      {roomTypes.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#173327]">
            Select Room Type for Cost Breakdown:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {roomTypes.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => setSelectedRoomTypeId(rt.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                  selectedRoomTypeId === rt.id
                    ? 'border-[#173327] bg-[#173327] text-white shadow-xs'
                    : 'border-[#ECE8DD] bg-[#FCFBF7] text-[#3D3A33] hover:border-gray-300'
                }`}
              >
                <p className="truncate font-bold">{rt.name}</p>
                <p className={`text-[10px] ${selectedRoomTypeId === rt.id ? 'text-emerald-100' : 'text-gray-500'}`}>
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
        <div className="p-4 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D3A33]">
            1. Upfront Move-In Total
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#173327]">
              {formatCurrency(upfrontTotal)}
            </span>
          </div>
          <p className="text-[11px] text-[#3D3A33]">
            Includes 1st month rent + refundable deposit of {formatCurrency(deposit)}
          </p>
        </div>

        {/* Estimated Monthly Living Cost */}
        <div className="p-4 rounded-xl bg-[#F0F5F2] border border-[#DCE8E2] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#173327]">
            2. Estimated Monthly Living Total
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#173327]">
              {formatCurrency(monthlyTotal)}
            </span>
            <span className="text-xs font-semibold text-[#173327]">/ mo</span>
          </div>
          <p className="text-[11px] text-[#173327]/80">
            Rent + sub-metered electricity + housekeeping + meals
          </p>
        </div>
      </div>

      {/* Itemized Line Items Breakdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#173327]">
          <span>Itemized Living Cost Details</span>
          <span className="text-[10px] text-[#3D3A33] font-medium">Billed Frequency</span>
        </div>

        <div className="divide-y divide-[#ECE8DD] border border-[#ECE8DD] rounded-xl overflow-hidden bg-white text-xs">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-gray-500 animate-pulse">
              Calculating transparent living costs...
            </div>
          ) : cost?.lineItems && cost.lineItems.length > 0 ? (
            cost.lineItems.map((item, index) => (
              <div
                key={index}
                className="p-3.5 flex items-center justify-between hover:bg-[#FCFBF7] transition-colors"
              >
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#173327]">{item.name}</span>
                    {item.category === CostCategory.FIXED && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#DCE8E2] text-[#173327]">
                        Fixed
                      </span>
                    )}
                    {item.category === CostCategory.ESTIMATED && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FAEBDE] text-[#E06D3B]">
                        Metered / Est.
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-[#3D3A33] leading-tight">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-[#173327]">
                    {item.amount === 0 ? 'Included' : formatCurrency(item.amount)}
                  </span>
                  <p className="text-[10px] text-gray-400 capitalize">
                    {item.frequency.toLowerCase()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">
              No cost items configured yet.
            </div>
          )}
        </div>
      </div>

      {/* Security Deposit Terms Callout */}
      <div className="p-3.5 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD] flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-[#E06D3B] shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[#3D3A33]">
          <p className="font-bold text-[#173327]">Deposit Protection Guarantee</p>
          <p className="text-[11px] leading-relaxed">
            Security deposit of {formatCurrency(deposit)} is 100% refundable subject to a {data?.noticePeriodDays || 30}-day notice period.
            No deduction for ordinary wear and tear.
          </p>
        </div>
      </div>
    </div>
  );
}
