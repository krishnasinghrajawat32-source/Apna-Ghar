'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Utensils,
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Send,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth-store';
import { Mess, DayOfWeek, MealPlan, DietaryType } from '@apna-ghar/shared-types';

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function MessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [dietaryPref, setDietaryPref] = useState<DietaryType>('PURE_VEG');
  const [deliveryType, setDeliveryType] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: mess, isLoading } = useQuery<Mess>({
    queryKey: ['mess-detail', slug],
    queryFn: () => apiClient<Mess>(`/mess/${slug}`),
    enabled: !!slug,
  });

  const subscribeMutation = useMutation({
    mutationFn: (payload: {
      messId: string;
      planId: string;
      startDate: string;
      dietaryPreference: string;
      deliveryAddress?: { street: string; city: string; state: string; pincode: string };
    }) =>
      apiClient('/mess/subscriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setRequestSuccess(true);
      setTimeout(() => {
        setRequestModalOpen(false);
        setRequestSuccess(false);
      }, 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to submit request');
    },
  });

  const handleOpenRequest = (plan: MealPlan) => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/mess/${slug}`);
      return;
    }
    setSelectedPlan(plan);
    setDietaryPref(mess?.dietaryType === 'PURE_VEG' ? 'PURE_VEG' : 'VEG_AND_NON_VEG');
    setErrorMessage('');
    setRequestModalOpen(true);
  };

  const handleSendRequest = () => {
    if (!mess || !selectedPlan) return;
    setErrorMessage('');

    subscribeMutation.mutate({
      messId: mess.id,
      planId: selectedPlan.id,
      startDate: new Date(startDate || Date.now()).toISOString(),
      dietaryPreference: dietaryPref,
      deliveryAddress:
        deliveryType === 'DELIVERY'
          ? {
              street: deliveryAddress || 'Campus Hostel',
              city: mess.address.city,
              state: mess.address.state,
              pincode: mess.address.pincode,
            }
          : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#102B50] border-t-[#F5A623] rounded-full animate-spin" />
          <p className="text-xs text-[#263445] font-semibold">Loading mess outlet menu & meal plans...</p>
        </div>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 bg-[#FAF8F3]">
        <h2 className="text-xl font-black text-[#102B50]">Mess Outlet Not Found</h2>
        <p className="text-xs text-[#687586] max-w-md">
          The requested mess or tiffin service does not exist or is currently inactive.
        </p>
        <Link
          href="/mess"
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition"
        >
          Return to Mess Directory
        </Link>
      </div>
    );
  }

  const activeDayMenu = mess.weeklyMenu?.find((m) => m.day === selectedDay);

  const googleMapsUrl = mess.location?.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${mess.location.coordinates[1]},${mess.location.coordinates[0]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${mess.name}, ${mess.address.street}, ${mess.address.city}`,
      )}`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
              <ShieldCheck className="w-4 h-4 text-[#21865B]" />
              FSSAI Lic. #{mess.fssaiNumber || 'Pending'}
            </span>

            {mess.isPhysicallyVerified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#102B50] text-white">
                <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
                Kitchen Physically Verified
              </span>
            )}

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F3] text-[#102B50] border border-[#E8E5DE]">
              {mess.dietaryType === 'PURE_VEG'
                ? '100% Pure Veg'
                : mess.dietaryType === 'JAIN_AVAILABLE'
                ? 'Satvik / Jain Available'
                : 'Veg & Non-Veg'}
            </span>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] border border-[#E8E5DE] hover:bg-white transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-[#687586]" />
          </a>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#102B50] tracking-tight">
            {mess.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#687586] mt-1 max-w-3xl leading-relaxed">
            {mess.description || 'Verified hygienic student mess serving balanced, home-cooked daily meals.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#263445] pt-3 border-t border-[#E8E5DE]">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#F5A623] shrink-0" />
            <span>
              {mess.address.street}, {mess.address.city}, {mess.address.state} — {mess.address.pincode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#687586] shrink-0" />
            <span>
              Lunch: {mess.operatingHours?.lunch || '12:00 - 3:00 PM'} • Dinner: {mess.operatingHours?.dinner || '7:30 - 10:30 PM'}
            </span>
          </div>

          {mess.deliveryRadiusKm && (
            <div className="flex items-center gap-1.5 text-[#21865B] font-bold">
              <span>Delivery Radius: {mess.deliveryRadiusKm} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Rotating Menu & Meal Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Weekly Rotating Menu */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5A623]" />
                  <span>Rotating Weekly Menu</span>
                </h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Daily changing variety curated for student nutrition and homestyle taste.
                </p>
              </div>
            </div>

            {/* Days bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-[#102B50] text-white shadow-sm'
                      : 'bg-[#FAF8F3] text-[#263445] border border-[#E8E5DE] hover:border-[#F5A623]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Day's Meals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-1.5">
                <span className="font-bold text-[#102B50] block uppercase tracking-wider text-[10px]">
                  Breakfast
                </span>
                <p className="text-[#263445] font-medium leading-relaxed">
                  {activeDayMenu?.breakfast || 'Poha / Upma + Sprouts + Hot Tea'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-1.5">
                <span className="font-bold text-[#102B50] block uppercase tracking-wider text-[10px]">
                  Lunch
                </span>
                <p className="text-[#263445] font-medium leading-relaxed">
                  {activeDayMenu?.lunch || 'Seasonal Vegetable + Dal Tadka + Phulkas + Steamed Rice + Fresh Salad'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-1.5">
                <span className="font-bold text-[#102B50] block uppercase tracking-wider text-[10px]">
                  Evening Snacks
                </span>
                <p className="text-[#263445] font-medium leading-relaxed">
                  {activeDayMenu?.snacks || 'Light snacks with herbal / masala tea'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-1.5">
                <span className="font-bold text-[#102B50] block uppercase tracking-wider text-[10px]">
                  Dinner
                </span>
                <p className="text-[#263445] font-medium leading-relaxed">
                  {activeDayMenu?.dinner || 'Paneer Butter Masala / Veg Kofta + Yellow Dal + Rotis + Jeera Rice + Dessert'}
                </p>
              </div>
            </div>

            {activeDayMenu?.specialDietNote && (
              <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E8E5DE] text-xs text-[#687586]">
                <span className="font-bold text-[#102B50]">Dietary Note:</span> {activeDayMenu.specialDietNote}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monthly Meal Plans */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-[#102B50]">Available Meal Plans</h2>
              <p className="text-xs text-[#687586] mt-0.5">
                Submit a subscription request. Payment is not processed online.
              </p>
            </div>

            <div className="space-y-3">
              {(mess.plans || []).map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] space-y-3 hover:border-[#102B50] transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#102B50]">{plan.name}</h3>
                      <p className="text-[11px] text-[#687586] mt-0.5">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-[#102B50] block">
                        {formatCurrency(plan.monthlyPrice)}
                      </span>
                      <span className="text-[9px] text-[#687586] block">/ month</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {plan.mealTypes?.includes('BREAKFAST') && (
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E8E5DE] font-semibold">Breakfast</span>
                    )}
                    {plan.mealTypes?.includes('LUNCH') && (
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E8E5DE] font-semibold">Lunch</span>
                    )}
                    {plan.mealTypes?.includes('SNACKS') && (
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E8E5DE] font-semibold">Snacks</span>
                    )}
                    {plan.mealTypes?.includes('DINNER') && (
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E8E5DE] font-semibold">Dinner</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenRequest(plan)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Request Subscription</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E8E5DE] text-[10px] text-[#687586] space-y-1">
              <span className="font-bold text-[#102B50] block">How it works:</span>
              <p>1. Submit a dining subscription request with your preferred start date.</p>
              <p>2. The mess partner reviews and accepts your request.</p>
              <p>3. Your dining pass is activated directly with the kitchen (No payment collected online).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Request Modal */}
      {requestModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E5DE] space-y-4">
            <div className="flex items-center gap-2 text-[#102B50]">
              <Utensils className="w-5 h-5 text-[#F5A623]" />
              <h3 className="font-extrabold text-base">Request Meal Plan Subscription</h3>
            </div>

            {requestSuccess ? (
              <div className="p-6 text-center space-y-3 bg-[#21865B]/10 border border-[#21865B]/20 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-[#21865B] mx-auto" />
                <h4 className="font-bold text-sm text-[#102B50]">Request Submitted Successfully!</h4>
                <p className="text-xs text-[#687586]">
                  The mess partner has been notified of your request. You can track status in your dashboard.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E8E5DE] text-xs space-y-1">
                  <div className="flex justify-between font-bold text-[#102B50]">
                    <span>{selectedPlan.name}</span>
                    <span>{formatCurrency(selectedPlan.monthlyPrice)} / mo</span>
                  </div>
                  <span className="text-[10px] text-[#687586] block">
                    Listed reference price (Payment is deferred and not collected online)
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-[#D64545]/10 border border-[#D64545]/30 text-xs text-[#D64545] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#102B50] mb-1">Target Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#102B50] mb-1">Dining Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('DINE_IN')}
                        className={`p-2 rounded-xl font-bold border transition ${
                          deliveryType === 'DINE_IN'
                            ? 'bg-[#102B50] text-white border-[#102B50]'
                            : 'bg-white text-[#687586] border-[#E8E5DE]'
                        }`}
                      >
                        Mess Dining Hall
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('DELIVERY')}
                        className={`p-2 rounded-xl font-bold border transition ${
                          deliveryType === 'DELIVERY'
                            ? 'bg-[#102B50] text-white border-[#102B50]'
                            : 'bg-white text-[#687586] border-[#E8E5DE]'
                        }`}
                      >
                        Hostel Tiffin Delivery
                      </button>
                    </div>
                  </div>

                  {deliveryType === 'DELIVERY' && (
                    <div>
                      <label className="block font-bold text-[#102B50] mb-1">Hostel Delivery Address</label>
                      <input
                        type="text"
                        placeholder="Room #, Hostel Name, Landmark..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#687586] hover:bg-[#FAF8F3] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendRequest}
                    disabled={subscribeMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{subscribeMutation.isPending ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
