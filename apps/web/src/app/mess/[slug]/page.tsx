'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Utensils,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Mess, MealPlan, DayOfWeek, MessSubscription } from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function MessDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [subscribingPlan, setSubscribingPlan] = useState<MealPlan | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [dietaryPref, setDietaryPref] = useState<'VEG' | 'NON_VEG' | 'JAIN'>('VEG');
  const [createdSubscription, setCreatedSubscription] = useState<MessSubscription | null>(null);
  const [subError, setSubError] = useState('');

  const {
    data: mess,
    isLoading,
    error,
  } = useQuery<Mess>({
    queryKey: ['mess-detail', params.slug],
    queryFn: () => apiClient<Mess>(`/mess/${params.slug}`),
    enabled: !!params.slug,
  });

  const subscribeMutation = useMutation({
    mutationFn: () =>
      apiClient<MessSubscription>('/mess/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          messId: mess?.id,
          planId: subscribingPlan?.id,
          startDate,
          dietaryPreference: dietaryPref,
        }),
      }),
    onSuccess: (data) => {
      setCreatedSubscription(data);
      queryClient.invalidateQueries({ queryKey: ['student-mess-subscriptions'] });
    },
    onError: (err: any) => {
      setSubError(err?.message || 'Failed to create subscription.');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <Utensils className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Loading mess menu and dining plans...</p>
      </div>
    );
  }

  if (error || !mess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Mess Outlet Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested mess outlet may not be active or does not exist.
        </p>
        <Link
          href="/mess"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Browse All Messes</span>
        </Link>
      </div>
    );
  }

  const currentMenu = mess.weeklyMenu?.find((m) => m.day === selectedDay);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <Link
        href="/mess"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Mess Directory</span>
      </Link>

      {/* Hero Header Card */}
      <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {mess.dietaryType === 'PURE_VEG'
                  ? '100% Pure Veg'
                  : mess.dietaryType === 'JAIN_AVAILABLE'
                  ? 'Satvik / Jain Available'
                  : 'Veg & Non-Veg'}
              </span>

              <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{mess.rating} (Verified Student Rating)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#173327] tracking-tight">
              {mess.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {mess.description}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 bg-[#FCFBF7] p-4 rounded-2xl border border-[#ECE8DD]">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>FSSAI Certified Kitchen</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">Lic. #{mess.fssaiNumber}</span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1">
              ✓ RO Mineral Water • Daily Sanitized
            </span>
          </div>
        </div>

        {/* Info Grid: Address & Operating Timings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location</span>
            </span>
            <span className="font-bold text-slate-900 block truncate">
              {mess.address.street}, {mess.address.city}
            </span>
            {mess.address.landmark && (
              <span className="text-[11px] text-slate-500 block">Near: {mess.address.landmark}</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Meal Timings</span>
            </span>
            <span className="text-slate-800 block">
              Lunch: <span className="font-bold text-slate-900">{mess.operatingHours.lunch}</span>
            </span>
            <span className="text-slate-800 block">
              Dinner: <span className="font-bold text-slate-900">{mess.operatingHours.dinner}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>Student Amenities</span>
            </span>
            <span className="text-slate-800 block font-semibold">
              Unlimited Roti & Dal • Weekend Sweets
            </span>
            <span className="text-[11px] text-slate-500 block">
              Direct campus delivery available
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: Rotating 7-Day Weekly Menu */}
      <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#ECE8DD]">
          <div>
            <h2 className="text-lg font-black text-[#173327] flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              <span>Rotating 7-Day Student Menu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent daily meal breakdown prepared fresh twice every day.
            </p>
          </div>

          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Live Schedule Updated Weekly
          </span>
        </div>

        {/* Day Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-[#173327] text-white shadow-xs'
                  : 'bg-[#FCFBF7] text-slate-600 border border-[#ECE8DD] hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Day's Menu Display */}
        {currentMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
                  Breakfast
                </span>
                <span className="text-[11px] text-slate-400">{mess.operatingHours.breakfast}</span>
              </div>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {currentMenu.breakfast}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  Lunch
                </span>
                <span className="text-[11px] text-slate-400">{mess.operatingHours.lunch}</span>
              </div>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {currentMenu.lunch}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                  Dinner
                </span>
                <span className="text-[11px] text-slate-400">{mess.operatingHours.dinner}</span>
              </div>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {currentMenu.dinner}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-[#DDD7C7] rounded-2xl text-center text-xs text-slate-500">
            Menu for {selectedDay} is following standard daily homestyle seasonal rotation.
          </div>
        )}

        {currentMenu?.specialDietNote && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{currentMenu.specialDietNote}</span>
          </div>
        )}
      </div>

      {/* SECTION: Subscription Plans */}
      <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-[#173327]">Monthly Dining Subscription Plans</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a plan tailored to your study schedule. Instant digital QR pass issued upon activation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mess.plans?.map((plan) => (
            <div
              key={plan.id}
              className="p-6 rounded-3xl border-2 border-[#ECE8DD] hover:border-[#173327] transition bg-[#FCFBF7] flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-[#DCE8E2] text-[#173327]">
                    {plan.daysPerWeek} Days / Week
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {plan.mealTypes.join(' + ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.description}</p>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-2xl font-black text-[#173327]">
                    {formatCurrency(plan.monthlyPrice)}
                  </span>
                  <span className="text-xs text-slate-500"> / month</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSubError('');
                  setSubscribingPlan(plan);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Select & Subscribe</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Modal */}
      {subscribingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECE8DD]">
              <div className="flex items-center gap-2 text-[#173327]">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base">Subscribe to Meal Plan</h3>
              </div>
              <button
                onClick={() => {
                  setSubscribingPlan(null);
                  setCreatedSubscription(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdSubscription ? (
              /* Success confirmation with QR coupon pass */
              <div className="text-center space-y-4 py-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">Subscription Active!</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your monthly meal pass for {createdSubscription.planName} has been generated.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-left text-xs font-mono">
                  <div className="flex justify-between items-center text-emerald-300">
                    <span>{createdSubscription.subscriptionNumber}</span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    Pass Code: {createdSubscription.qrPassCode}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Valid: {new Date(createdSubscription.startDate).toLocaleDateString('en-IN')} –{' '}
                    {new Date(createdSubscription.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-2">
                  <Link
                    href="/student/dashboard"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                  >
                    Go To Student Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              /* Form */
              <div className="space-y-4 text-xs">
                {subError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{subError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD] space-y-1">
                  <span className="font-extrabold text-slate-900 block">{subscribingPlan.name}</span>
                  <div className="flex justify-between text-slate-600">
                    <span>{mess.name}</span>
                    <span className="font-black text-[#173327]">
                      {formatCurrency(subscribingPlan.monthlyPrice)} / mo
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subscription Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dietary Requirement
                  </label>
                  <select
                    value={dietaryPref}
                    onChange={(e) => setDietaryPref(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="VEG">Vegetarian</option>
                    <option value="JAIN">Jain (No Onion / Garlic)</option>
                    <option value="NON_VEG">Non-Vegetarian</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSubscribingPlan(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push(`/login?returnUrl=/mess/${mess.slug}`);
                        return;
                      }
                      subscribeMutation.mutate();
                    }}
                    disabled={subscribeMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition disabled:opacity-50"
                  >
                    {subscribeMutation.isPending ? 'Activating...' : 'Confirm Subscription'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
