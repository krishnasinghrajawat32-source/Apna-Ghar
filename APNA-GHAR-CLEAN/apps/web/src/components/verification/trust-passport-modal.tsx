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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#ECE8DD] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#173327] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#234E3C] flex items-center justify-center text-[#E06D3B]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Apna Ghar Trust Passport</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E06D3B] text-white">
                  {score}/7 Verified
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 truncate max-w-md">
                7-Point Physical Verification Audit for {propertyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 7 Checkpoints List */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-[#ECE8DD]">
          <div className="pb-2">
            <p className="text-xs text-[#3D3A33] leading-relaxed">
              The Apna Ghar Trust Passport is our non-negotiable quality standard. An authorized field engineer
              physically visits and audits the property across 7 essential security, pricing, and infrastructure checkpoints.
            </p>
          </div>

          {Object.entries(CHECKPOINT_META).map(([typeKey, meta]) => {
            const checkpoint = Array.isArray(checkpoints)
              ? checkpoints.find((c: TrustCheckpoint) => c.type === typeKey)
              : null;
            const isVerified = checkpoint?.status === VerificationStatus.VERIFIED;
            const Icon = meta.icon;

            return (
              <div key={typeKey} className="pt-4 flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isVerified
                      ? 'bg-[#DCE8E2] text-[#173327]'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-[#173327]">
                      {meta.title}
                    </h4>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#173327] bg-[#DCE8E2] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[#173327]" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending Audit
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#3D3A33] leading-normal">
                    {meta.subtitle}
                  </p>
                  {checkpoint?.notes && (
                    <div className="bg-[#FCFBF7] p-2 rounded-lg border border-[#ECE8DD] text-[10px] text-[#173327] font-medium flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3 h-3 text-[#E06D3B] shrink-0" />
                      <span>{checkpoint.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FCFBF7] border-t border-[#ECE8DD] flex items-center justify-between shrink-0 text-xs">
          <span className="text-[#3D3A33]">
            {passport?.lastVerifiedAt
              ? `Last verified on ${new Date(passport.lastVerifiedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'Audit status live in database'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
