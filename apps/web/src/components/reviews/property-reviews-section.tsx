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
    <section className="bg-white rounded-3xl border border-[#E8E5DE] p-6 sm:p-8 shadow-brand-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E5DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#102B50]">Student Reviews & Ratings</h2>
            <div className="flex items-center gap-1 text-xs font-black text-[#102B50] bg-[#F5A623]/20 px-2.5 py-0.5 rounded-full border border-[#F5A623]/30">
              <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
              <span>4.9 / 5.0</span>
            </div>
          </div>
          <p className="text-xs text-[#687586]">
            Verified experiences from students living at {propertyName}.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="border border-[#E8E5DE] rounded-2xl p-5 bg-[#FAF8F3] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#102B50]">
                    {rev.studentName}
                  </span>
                  {rev.verifiedStay && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#21865B] bg-[#21865B]/10 px-2.5 py-0.5 rounded-full border border-[#21865B]/20">
                      <ShieldCheck className="w-3 h-3 text-[#21865B]" />
                      Verified Resident
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#687586] font-medium">{rev.university}</span>
              </div>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]"
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-[#263445] leading-relaxed">{rev.comment}</p>
            <span className="text-[10px] text-[#687586] block">{rev.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
