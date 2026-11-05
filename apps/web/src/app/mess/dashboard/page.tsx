'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Utensils,
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle2,
  Save,
  ArrowUpRight,
  TrendingUp,
  Phone,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { UserRole, Mess, MessSubscription, DailyMenu, DayOfWeek } from '@apna-ghar/shared-types';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function MessPartnerDashboardPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [menuBreakfast, setMenuBreakfast] = useState('');
  const [menuLunch, setMenuLunch] = useState('');
  const [menuSnacks, setMenuSnacks] = useState('');
  const [menuDinner, setMenuDinner] = useState('');
  const [menuSpecialNote, setMenuSpecialNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch Partner Mess Outlet
  const { data: mess } = useQuery<Mess>({
    queryKey: ['partner-mess'],
    queryFn: () => apiClient<Mess>('/mess/partner/my-mess'),
    enabled: isAuthenticated,
  });

  // 2. Fetch Active Subscribers
  const { data: subscribers = [] } = useQuery<MessSubscription[]>({
    queryKey: ['partner-subscribers'],
    queryFn: () => apiClient<MessSubscription[]>('/mess/partner/subscribers'),
    enabled: isAuthenticated,
  });

  // Sync menu state when day or mess data changes
  React.useEffect(() => {
    if (mess?.weeklyMenu) {
      const dayMenu = mess.weeklyMenu.find((m) => m.day === selectedDay);
      setMenuBreakfast(dayMenu?.breakfast || '');
      setMenuLunch(dayMenu?.lunch || '');
      setMenuSnacks(dayMenu?.snacks || '');
      setMenuDinner(dayMenu?.dinner || '');
      setMenuSpecialNote(dayMenu?.specialDietNote || '');
    }
  }, [selectedDay, mess]);

  // Update Weekly Menu Mutation
  const updateMenuMutation = useMutation({
    mutationFn: () => {
      const currentList = mess?.weeklyMenu ? [...mess.weeklyMenu] : [];
      const index = currentList.findIndex((m) => m.day === selectedDay);

      const updatedDay: DailyMenu = {
        day: selectedDay,
        breakfast: menuBreakfast,
        lunch: menuLunch,
        snacks: menuSnacks,
        dinner: menuDinner,
        specialDietNote: menuSpecialNote,
      };

      if (index >= 0) {
        currentList[index] = updatedDay;
      } else {
        currentList.push(updatedDay);
      }

      return apiClient<Mess>(`/mess/partner/weekly-menu?messId=${mess?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ weeklyMenu: currentList }),
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['partner-mess'] });
    },
  });

  const totalMonthlyVolume = subscribers.reduce((acc, sub) => acc + (sub.monthlyPrice || 0), 0);

  return (
    <AuthGuard allowedRoles={[UserRole.MESS_PARTNER, UserRole.ADMIN]}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E5DE]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center shrink-0 shadow-sm">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                  {mess?.name || 'Mess Partner Portal'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                  <ShieldCheck className="w-3 h-3 text-[#21865B]" />
                  FSSAI Verified
                </span>
              </div>
              <p className="text-xs text-[#687586] mt-0.5">
                Daily Rotating Menu & Student Dining Pass Management • Partner ID: {user?.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mess?.slug && (
              <Link
                href={`/mess/${mess.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-white border border-[#E8E5DE] hover:bg-[#FAF8F3] transition shadow-xs"
              >
                <span>View Public Page</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#687586]" />
              </Link>
            )}
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm space-y-1.5">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Active Subscribers
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#102B50]">{subscribers.length}</p>
              <Users className="w-4 h-4 text-[#21865B]" />
            </div>
            <span className="text-[10px] text-[#687586]">Monthly student dining passes</span>
          </div>

          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm space-y-1.5">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Monthly Plan Volume
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#21865B]">
                {formatCurrency(totalMonthlyVolume)}
              </p>
              <TrendingUp className="w-4 h-4 text-[#21865B]" />
            </div>
            <span className="text-[10px] text-[#687586]">Recurring monthly dining revenue</span>
          </div>

          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 shadow-brand-sm space-y-1.5">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Dietary Certification
            </span>
            <p className="text-base font-black text-[#102B50] mt-1">
              {mess?.dietaryType === 'PURE_VEG'
                ? 'Pure Vegetarian'
                : mess?.dietaryType === 'JAIN_AVAILABLE'
                ? 'Jain / Satvik Certified'
                : 'Veg & Non-Veg'}
            </p>
            <span className="text-[10px] text-[#687586]">FSSAI Lic. #{mess?.fssaiNumber || 'Pending'}</span>
          </div>
        </div>

        {/* SECTION: Rotating Weekly Menu Management */}
        <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
            <div>
              <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F5A623]" />
                <span>Weekly Rotating Menu Schedule</span>
              </h2>
              <p className="text-xs text-[#687586] mt-0.5">
                Update dishes for breakfast, lunch, and dinner to notify student subscribers.
              </p>
            </div>

            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#21865B] bg-[#21865B]/10 border border-[#21865B]/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                <span>Menu Saved Successfully!</span>
              </span>
            )}
          </div>

          {/* Days bar */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-[#102B50] text-white shadow-sm'
                    : 'bg-[#FAF8F3] text-[#263445] border border-[#E8E5DE] hover:border-[#F5A623]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Day's Form */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#102B50] mb-1.5">
                  Breakfast Items ({selectedDay})
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Indori Poha + Sprouts + Tea"
                  value={menuBreakfast}
                  onChange={(e) => setMenuBreakfast(e.target.value)}
                  className="w-full p-3 border border-[#E8E5DE] rounded-xl text-xs text-[#263445] bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102B50] mb-1.5">
                  Lunch Items ({selectedDay})
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Shahi Paneer + Dal Tadka + Phulkas + Rice + Salad"
                  value={menuLunch}
                  onChange={(e) => setMenuLunch(e.target.value)}
                  className="w-full p-3 border border-[#E8E5DE] rounded-xl text-xs text-[#263445] bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102B50] mb-1.5">
                  Dinner Items ({selectedDay})
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mix Veg + Dal Makhani + Roti + Rice + Sweet"
                  value={menuDinner}
                  onChange={(e) => setMenuDinner(e.target.value)}
                  className="w-full p-3 border border-[#E8E5DE] rounded-xl text-xs text-[#263445] bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#102B50] mb-1.5">
                Special Dietary or Preparation Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Jain preparation available on order / Sunday Special Feast"
                value={menuSpecialNote}
                onChange={(e) => setMenuSpecialNote(e.target.value)}
                className="w-full p-3 border border-[#E8E5DE] rounded-xl text-xs text-[#263445] bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => updateMenuMutation.mutate()}
                disabled={updateMenuMutation.isPending}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updateMenuMutation.isPending ? 'Saving Menu...' : `Save ${selectedDay} Menu`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: Active Student Subscribers */}
        <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DE]">
            <div>
              <h2 className="text-base font-black text-[#102B50]">
                Active Student Dining Subscribers ({subscribers.length})
              </h2>
              <p className="text-xs text-[#687586]">
                Verified meal plan subscriptions and valid coupon tokens.
              </p>
            </div>
          </div>

          {subscribers.length === 0 ? (
            <div className="p-10 border border-dashed border-[#E8E5DE] rounded-2xl text-center space-y-2 bg-[#FAF8F3]">
              <Users className="w-8 h-8 text-[#687586] mx-auto" />
              <p className="text-xs font-bold text-[#102B50]">No active meal plan subscribers yet</p>
              <p className="text-[11px] text-[#687586] max-w-sm mx-auto">
                Students living in nearby hostels will discover your mess in the directory and subscribe to your meal plans.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#102B50] bg-white border border-[#E8E5DE] px-2 py-0.5 rounded">
                        {sub.subscriptionNumber}
                      </span>
                      <span className="font-bold text-[#102B50]">{sub.student?.name || 'Student'}</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B]">
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-[#687586] flex items-center gap-3 text-[11px]">
                      <span>Plan: <span className="font-semibold text-[#102B50]">{sub.planName}</span></span>
                      <span>•</span>
                      <span>Diet: <span className="font-semibold text-[#102B50]">{sub.dietaryPreference}</span></span>
                      {sub.student?.phone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#687586]" />
                            <span>{sub.student.phone}</span>
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-[#102B50] block">
                      {formatCurrency(sub.monthlyPrice)} / mo
                    </span>
                    <span className="text-[10px] text-[#687586]">
                      Valid till {new Date(sub.endDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
