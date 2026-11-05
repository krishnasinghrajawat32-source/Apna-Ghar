'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { TrustPassport, VerificationStatus, TrustCheckpoint } from '@apna-ghar/shared-types';
import { TrustPassportModal } from './trust-passport-modal';

interface TrustPassportCardProps {
  passport: TrustPassport | null;
  propertyName: string;
}

export function TrustPassportCard({ passport, propertyName }: TrustPassportCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const checkpoints: TrustCheckpoint[] = passport?.checkpoints || [];
  const score = Array.isArray(checkpoints)
    ? checkpoints.filter((c: TrustCheckpoint) => c.status === VerificationStatus.VERIFIED).length
    : 0;

  const isFullyVerified = passport?.isFullyVerified || score === 7;

  return (
    <>
      <div className="bg-white rounded-3xl border border-[#E8E5DE] p-6 shadow-brand-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#102B50]">
                  Apna Ghar Trust Passport
                </h3>
                {isFullyVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#21865B] text-white">
                    7/7 VERIFIED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F5A623]/20 text-[#102B50] border border-[#F5A623]/40">
                    {score}/7 VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#687586]">
                7-point physical on-site audit verified by Apna Ghar team
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-bold text-[#F5A623] hover:text-[#E99A12] flex items-center gap-1 transition-colors"
          >
            <span>View Full Audit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 7 Checkpoint Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {[
            'Owner KYC',
            'GPS Location',
            'Real Photos',
            'Zero Hidden Fees',
            'Wi-Fi & Power',
            'Bed Inventory',
            'Legal Lease',
          ].map((item) => (
            <div
              key={item}
              className="px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] flex items-center gap-2 text-[11px] font-bold text-[#102B50]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B] shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <TrustPassportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        passport={passport}
        propertyName={propertyName}
      />
    </>
  );
}
