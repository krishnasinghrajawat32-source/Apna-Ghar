'use client';

import React from 'react';
import { Star, ShieldCheck } from 'lucide-react';

interface PropertyReviewsSectionProps {
  propertyId: string;
  propertyName: string;
}

export function PropertyReviewsSection({
  propertyId: _propertyId,
  propertyName,
}: PropertyReviewsSectionProps) {
  // Mock verified resident reviews
  const reviews = [
    {
      id: 'rev-1',
      studentName: 'Aarav Sharma',
      university: 'Amity University Noida',
      rating: 5,
      date: '2 weeks ago',
      verifiedStay: true,
      comment:
        'The transparent pricing with no hidden charges is exactly as advertised. Wi-Fi is super fast and the biometric security gave my parents total peace of mind.',
    },
    {
      id: 'rev-2',
      studentName: 'Priya Verma',
      university: 'Galgotias University',
      rating: 5,
      date: '1 month ago',
      verifiedStay: true,
      comment:
        'Smooth move-in with the digital QR pass. The room matched the photos 100%, and the property manager was very helpful during initial settling in.',
    },
  ];

  return (
    <section className="bg-white rounded-2xl border border-[#ECE8DD] p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#ECE8DD]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#173327]">Student Reviews & Ratings</h2>
            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>4.9 / 5.0</span>
            </div>
          </div>
          <p className="text-xs text-[#3D3A33]">
            Verified experiences from students living at {propertyName}.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="border border-[#ECE8DD] rounded-xl p-4 bg-[#FCFBF7] space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#173327]">
                    {rev.studentName}
                  </span>
                  {rev.verifiedStay && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Resident
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500">{rev.university}</span>
              </div>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-[#3D3A33] leading-relaxed">{rev.comment}</p>
            <span className="text-[10px] text-gray-400 block">{rev.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
