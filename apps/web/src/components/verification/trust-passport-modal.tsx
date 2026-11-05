'use client';

import React from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Camera,
  BadgePercent,
  Tv,
  LayoutGrid,
  Scale,
} from 'lucide-react';
import { TrustPassport, VerificationType, VerificationStatus, TrustCheckpoint } from '@apna-ghar/shared-types';

interface TrustPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: TrustPassport | null;
  propertyName: string;
}

const CHECKPOINT_META: Record<
  VerificationType,
  { title: string; subtitle: string; icon: React.ElementType }
> = {
  [VerificationType.OWNER_IDENTITY]: {
    title: '1. Owner KYC & Identity Verification',
    subtitle: 'Government ID (Aadhaar & PAN) cross-checked against municipal property records.',
    icon: Scale,
  },
  [VerificationType.LOCATION]: {
    title: '2. Physical On-Site Geo-Audit',
    subtitle: 'Physical GPS coordinates audited on location to guarantee exact distance to campus.',
    icon: MapPin,
  },
  [VerificationType.PHOTOS]: {
    title: '3. Real Photo Authentication',
    subtitle: 'Every photo is audited on-site against actual rooms, lighting, and furniture layout.',
    icon: Camera,
  },
  [VerificationType.PRICING]: {
    title: '4. Transparent Pricing Audit',
    subtitle: 'Strict verification of base rent, deposit refund rules, and guarantee of zero hidden brokerage.',
    icon: BadgePercent,
  },
  [VerificationType.AMENITIES]: {
    title: '5. Functional Amenities Audit',
    subtitle: 'Physical testing of optical high-speed Wi-Fi, power backup inverter, geyser, and AC.',
    icon: Tv,
  },
  [VerificationType.INVENTORY]: {
    title: '6. Physical Bed & Room Inventory',
    subtitle: 'Every physical room number and individual bed is inventoried to prevent phantom vacancies.',
    icon: LayoutGrid,
  },
  [VerificationType.DOCUMENTS]: {
    title: '7. Legal Lease & Safety Compliance',
    subtitle: 'Police verification compliance, student rental agreement, and fire safety equipment.',
    icon: FileText,
  },
};

export function TrustPassportModal({
  isOpen,
  onClose,
  passport,
  propertyName,
}: TrustPassportModalProps) {
  if (!isOpen) return null;

  const checkpoints: TrustCheckpoint[] = passport?.checkpoints || [];
  const score = Array.isArray(checkpoints)
    ? checkpoints.filter((c: TrustCheckpoint) => c.status === VerificationStatus.VERIFIED).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E5DE] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#102B50] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-[#F5A623]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Apna Ghar Trust Passport</h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#F5A623] text-[#102B50]">
                  {score}/7 Verified
                </span>
              </div>
              <p className="text-xs text-white/70 truncate max-w-md">
                7-Point Physical Verification Audit for {propertyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 7 Checkpoints List */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-[#E8E5DE]">
          {Object.entries(CHECKPOINT_META).map(([type, meta], idx) => {
            const checkpoint = checkpoints.find((c: TrustCheckpoint) => c.type === type);
            const isVerified = checkpoint?.status === VerificationStatus.VERIFIED;
            const isPending = checkpoint?.status === VerificationStatus.PENDING;
            const Icon = meta.icon;

            return (
              <div
                key={type}
                className={`pt-4 first:pt-0 flex items-start gap-3.5 ${
                  idx !== 0 ? 'mt-4' : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isVerified
                      ? 'bg-[#21865B]/10 text-[#21865B]'
                      : isPending
                      ? 'bg-[#F5A623]/10 text-[#F5A623]'
                      : 'bg-[#687586]/10 text-[#687586]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#102B50]">{meta.title}</h4>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#21865B] bg-[#21865B]/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Audited
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        In Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#687586] bg-[#687586]/10 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#687586] leading-relaxed">
                    {meta.subtitle}
                  </p>
                  {checkpoint?.notes && (
                    <p className="text-[10px] text-[#102B50] bg-[#FAF8F3] p-2 rounded-lg border border-[#E8E5DE] mt-1 italic">
                      Auditor Note: {checkpoint.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF8F3] border-t border-[#E8E5DE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#687586]">
            <ShieldCheck className="w-4 h-4 text-[#21865B]" />
            <span>Audited on location by certified field officers</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-white border border-[#E8E5DE] hover:bg-[#FAF8F3] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
