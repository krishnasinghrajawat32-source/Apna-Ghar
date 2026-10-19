'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  ShieldCheck,
  Sparkles,
  Utensils,
  Lock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  PropertyReviewsResponse,
  Booking,
  BookingStatus,
  UserRole,
} from '@apna-ghar/shared-types';

interface PropertyReviewsSectionProps {
  propertyId: string;
  propertyName: string;
}

export function PropertyReviewsSection({
  propertyId,
  propertyName,
}: PropertyReviewsSectionProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  // Review submission state
  const [overallRating, setOverallRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // 1. Fetch Property Reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<PropertyReviewsResponse>({
    queryKey: ['property-reviews', propertyId],
    queryFn: () => apiClient<PropertyReviewsResponse>(`/reviews/property/${propertyId}`),
    enabled: !!propertyId,
  });

  // 2. Fetch Student Bookings to verify resident eligibility (Lock 3)
  const isStudent = isAuthenticated && user?.role === UserRole.STUDENT;
  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ['student-my-bookings'],
    queryFn: () => apiClient<Booking[]>('/bookings/my-bookings'),
    enabled: isStudent,
  });

  // Find if student has a confirmed or completed booking for this property
  const confirmedBooking = myBookings.find(
    (b) =>
      (b.propertyId === propertyId || (typeof b.propertyId === 'object' && (b.propertyId as any)?.id === propertyId)) &&
      (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED),
  );

  // Check if student already submitted a review
  const existingReview = reviewsData?.reviews.find(
    (r) => r.studentId === user?.id,
  );

  // 3. Create Review Mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: {
      propertyId: string;
      bookingId: string;
      rating: number;
      cleanlinessRating: number;
      foodRating: number;
      safetyRating: number;
      comment: string;
    }) =>
      apiClient('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setSubmissionSuccess(true);
      setSubmissionError(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['property-reviews', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-detail'] });
    },
    onError: (err: ApiError) => {
      setSubmissionError(err.message || 'Failed to submit review.');
    },
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!confirmedBooking) {
      setSubmissionError('Only verified resident students with confirmed stays can submit reviews.');
      return;
    }

    if (!comment.trim()) {
      setSubmissionError('Please provide review comments on your stay experience.');
      return;
    }

    createReviewMutation.mutate({
      propertyId,
      bookingId: confirmedBooking.id,
      rating: overallRating,
      cleanlinessRating,
      foodRating,
      safetyRating,
      comment: comment.trim(),
    });
  };

  const breakdown = reviewsData?.breakdown;
  const reviews = reviewsData?.reviews || [];

  return (
    <section id="reviews-section" className="space-y-6 pt-4 border-t border-[#ECE8DD]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#173327]">Verified Resident Reviews</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F3EE] text-[#173327]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Genuine Stays
            </span>
          </div>
          <p className="text-xs text-[#3D3A33]">
            Reviews and ratings posted exclusively by students who have confirmed bookings and lived at {propertyName}.
          </p>
        </div>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-white border border-[#ECE8DD] rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Score */}
          <div className="flex flex-col items-center justify-center text-center p-4 bg-[#FCFBF7] rounded-xl border border-[#ECE8DD]/60">
            <span className="text-4xl font-extrabold text-[#173327]">
              {breakdown && breakdown.totalReviews > 0 ? breakdown.averageOverall.toFixed(1) : '—'}
            </span>
            <div className="flex items-center gap-1 my-1.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    breakdown && star <= Math.round(breakdown.averageOverall)
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Based on {breakdown?.totalReviews || 0} verified resident reviews
            </span>
          </div>

          {/* Sub-Ratings */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#173327] mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cleanliness & Hygiene
                </span>
                <span>{breakdown && breakdown.totalReviews > 0 ? breakdown.averageCleanliness.toFixed(1) : '—'} / 5</span>
              </div>
              <div className="w-full h-2 bg-[#ECE8DD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${breakdown && breakdown.totalReviews > 0 ? (breakdown.averageCleanliness / 5) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#173327] mb-1">
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#E06D3B]" /> Food & Dining Quality
                </span>
                <span>{breakdown && breakdown.totalReviews > 0 ? breakdown.averageFood.toFixed(1) : '—'} / 5</span>
              </div>
              <div className="w-full h-2 bg-[#ECE8DD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E06D3B] rounded-full"
                  style={{ width: `${breakdown && breakdown.totalReviews > 0 ? (breakdown.averageFood / 5) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#173327] mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Safety & Warden Support
                </span>
                <span>{breakdown && breakdown.totalReviews > 0 ? breakdown.averageSafety.toFixed(1) : '—'} / 5</span>
              </div>
              <div className="w-full h-2 bg-[#ECE8DD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${breakdown && breakdown.totalReviews > 0 ? (breakdown.averageSafety / 5) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Star Distribution */}
          <div className="space-y-1.5 text-xs text-gray-600">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown?.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const total = breakdown?.totalReviews || 1;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-4 font-semibold text-right">{stars}</span>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <div className="flex-1 h-2 bg-[#ECE8DD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-[10px] text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Submission Section */}
      <div className="bg-[#FCFBF7] border border-[#ECE8DD] rounded-2xl p-6">
        {existingReview ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Thank you for submitting your verified resident review!</p>
              <p className="text-[11px] text-emerald-700">
                Your feedback helps fellow university students make confident, safe accommodation decisions.
              </p>
            </div>
          </div>
        ) : confirmedBooking ? (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
              <div>
                <h3 className="text-sm font-bold text-[#173327] flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-[#E06D3B]" />
                  Write a Verified Resident Review
                </h3>
                <p className="text-[11px] text-gray-500">
                  Stay verified for Booking Reference: <span className="font-semibold text-[#173327]">{confirmedBooking.bookingReference}</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified Resident
              </span>
            </div>

            {submissionError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            {submissionSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Your review has been successfully submitted and verified!</span>
              </div>
            )}

            {/* Star Ratings Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#173327] block">Overall Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= overallRating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#173327] block">Cleanliness</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCleanlinessRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= cleanlinessRating ? 'fill-emerald-500 text-emerald-600' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#173327] block">Food Quality</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFoodRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= foodRating ? 'fill-[#E06D3B] text-[#E06D3B]' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#173327] block">Safety & Security</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSafetyRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= safetyRating ? 'fill-blue-500 text-blue-600' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#173327] block">
                Your Authentic Experience
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific details about Wi-Fi speed, warden behavior, mess hygiene, and study atmosphere..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[#ECE8DD] bg-white focus:outline-none focus:ring-2 focus:ring-[#173327]/20 resize-none text-[#173327]"
              />
            </div>

            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {createReviewMutation.isPending ? 'Submitting Verified Review...' : 'Post Verified Resident Review'}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 text-xs text-[#3D3A33]">
            <div className="w-8 h-8 rounded-full bg-[#ECE8DD] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#173327]" />
            </div>
            <div>
              <p className="font-bold text-[#173327]">Verified Resident Gate Enforced</p>
              <p className="text-[11px] text-gray-500">
                To eliminate fake or sponsored reviews, only students with confirmed stays booked through Apna Ghar can submit reviews for this accommodation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#173327]">
          Recent Resident Reviews ({reviews.length})
        </h3>

        {reviewsLoading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading verified reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-[#ECE8DD] rounded-xl p-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-[#173327]">No Resident Reviews Yet</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Be the first verified resident student to share your stay experience at {propertyName}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-[#ECE8DD] rounded-xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#DCE8E2] text-[#173327] font-bold text-xs flex items-center justify-center">
                      {(rev.studentName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#173327]">
                          {rev.studentName || 'Verified Resident'}
                        </span>
                        {rev.verifiedStay && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3EE] text-emerald-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified Stay
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        Stayed & reviewed on {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-[#FCFBF7] px-2.5 py-1 rounded-lg border border-[#ECE8DD]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="text-xs font-black text-[#173327]">{rev.rating}.0</span>
                  </div>
                </div>

                {/* Sub-ratings badges */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600">
                    Cleanliness: <strong className="text-[#173327]">{rev.cleanlinessRating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600">
                    Food: <strong className="text-[#173327]">{rev.foodRating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600">
                    Safety: <strong className="text-[#173327]">{rev.safetyRating}/5</strong>
                  </span>
                </div>

                {/* Written Comment */}
                <p className="text-xs text-[#3D3A33] leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
