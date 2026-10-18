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
      <div className="bg-white rounded-2xl border border-[#ECE8DD] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCE8E2] text-[#173327] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#E06D3B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#173327]">
                  Apna Ghar Trust Passport
                </h3>
                {isFullyVerified ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#173327] text-white">
                    7/7 VERIFIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {score}/7 VERIFIED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#3D3A33]">
                7-point physical on-site audit verified by Apna Ghar
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-bold text-[#E06D3B] hover:text-[#C55728] flex items-center gap-1 transition-colors"
          >
            Audit Details
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 7 Checkpoint Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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
              className="px-2.5 py-1.5 rounded-lg bg-[#FCFBF7] border border-[#ECE8DD] flex items-center gap-1.5 text-[10px] font-semibold text-[#173327]"
            >
              <CheckCircle2 className="w-3 h-3 text-[#173327] shrink-0" />
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
