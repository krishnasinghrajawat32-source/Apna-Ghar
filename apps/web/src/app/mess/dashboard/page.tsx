'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Utensils,
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle2,
  Save,
  ArrowUpRight,
  Phone,
  Clock,
  MapPin,
  FileText,
  Plus,
  Trash2,
  XCircle,
  Building,
  Check,
  X,
  User,
  Info,
  QrCode,
  Wallet,
  ShoppingBag,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { LocationPicker } from '@/components/common/location-picker';
import { MediaUploader } from '@/components/common/media-uploader';
import {
  UserRole,
  Mess,
  MessSubscription,
  DailyMenu,
  DayOfWeek,
  SubscriptionStatus,
  ApprovalStatus,
  MealPlan,
} from '@apna-ghar/shared-types';

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export type DashboardTab =
  | 'overview'
  | 'menu'
  | 'outlet'
  | 'plans'
  | 'subscriptions'
  | 'profile'
  | 'qr'
  | 'customers'
  | 'earnings';

function MessPartnerDashboardInner() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  useEffect(() => {
    if (tabQuery) {
      if (
        [
          'overview',
          'menu',
          'outlet',
          'plans',
          'subscriptions',
          'profile',
          'qr',
          'customers',
          'earnings',
        ].includes(tabQuery)
      ) {
        setActiveTab(tabQuery as DashboardTab);
      }
    }
  }, [tabQuery]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');

  // Menu Form State
  const [menuBreakfast, setMenuBreakfast] = useState('');
  const [menuLunch, setMenuLunch] = useState('');
  const [menuSnacks, setMenuSnacks] = useState('');
  const [menuDinner, setMenuDinner] = useState('');
  const [menuSpecialNote, setMenuSpecialNote] = useState('');
  const [menuSuccess, setMenuSuccess] = useState(false);

  // Rejection Modal State
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // 1. Fetch Partner Mess Outlet
  const { data: mess } = useQuery<Mess>({
    queryKey: ['partner-mess'],
    queryFn: () => apiClient<Mess>('/mess/partner/my-mess'),
    enabled: isAuthenticated,
  });

  // 2. Fetch Partner Subscriptions / Requests
  const { data: subscribers = [], isLoading: isSubsLoading } = useQuery<MessSubscription[]>({
    queryKey: ['partner-subscribers'],
    queryFn: () => apiClient<MessSubscription[]>('/mess/partner/subscribers'),
    enabled: isAuthenticated,
  });

  // 3. Fetch Partner Profile
  const { data: partnerProfile } = useQuery<{
    partner: {
      id: string;
      businessName?: string;
      fssaiLicense?: string;
      gstin?: string;
      contactPhone?: string;
      contactEmail?: string;
      address?: string;
    };
    user: { name?: string; email?: string; phone?: string };
  }>({
    queryKey: ['partner-profile'],
    queryFn: () => apiClient('/mess/partner/profile'),
    enabled: isAuthenticated,
  });

  // Outlet Form State
  const [outletName, setOutletName] = useState('');
  const [outletDescription, setOutletDescription] = useState('');
  const [outletStreet, setOutletStreet] = useState('');
  const [outletCity, setOutletCity] = useState('Kota');
  const [outletState, setOutletState] = useState('Rajasthan');
  const [outletPincode, setOutletPincode] = useState('');
  const [outletCoordinates, setOutletCoordinates] = useState<[number, number]>([75.83, 25.14]);
  const [outletGooglePlaceId, setOutletGooglePlaceId] = useState('');
  const [outletDietaryType, setOutletDietaryType] = useState('PURE_VEG');
  const [outletFssai, setOutletFssai] = useState('');
  const [outletContactPhone, setOutletContactPhone] = useState('');
  const [outletContactEmail, setOutletContactEmail] = useState('');
  const [outletDeliveryRadiusKm, setOutletDeliveryRadiusKm] = useState<number>(3);
  const [outletBreakfastTiming, setOutletBreakfastTiming] = useState('7:30 AM - 10:00 AM');
  const [outletLunchTiming, setOutletLunchTiming] = useState('12:00 PM - 3:00 PM');
  const [outletDinnerTiming, setOutletDinnerTiming] = useState('7:30 PM - 10:30 PM');
  const [outletSuccess, setOutletSuccess] = useState(false);

  // Meal Plans Form State
  const [plansList, setPlansList] = useState<MealPlan[]>([]);
  const [plansSuccess, setPlansSuccess] = useState(false);

  // Profile Form State
  const [businessName, setBusinessName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Sync menu state when day or mess changes
  useEffect(() => {
    if (mess?.weeklyMenu) {
      const dayMenu = mess.weeklyMenu.find((m) => m.day === selectedDay);
      setMenuBreakfast(dayMenu?.breakfast || '');
      setMenuLunch(dayMenu?.lunch || '');
      setMenuSnacks(dayMenu?.snacks || '');
      setMenuDinner(dayMenu?.dinner || '');
      setMenuSpecialNote(dayMenu?.specialDietNote || '');
    }
  }, [selectedDay, mess]);

  // Sync outlet state when mess loads
  useEffect(() => {
    if (mess) {
      setOutletName(mess.name || '');
      setOutletDescription(mess.description || '');
      setOutletStreet(mess.address?.street || '');
      setOutletCity(mess.address?.city || 'Kota');
      setOutletState(mess.address?.state || 'Rajasthan');
      setOutletPincode(mess.address?.pincode || '');
      if (mess.location?.coordinates && mess.location.coordinates.length === 2) {
        setOutletCoordinates([mess.location.coordinates[0], mess.location.coordinates[1]]);
      }
      setOutletGooglePlaceId(mess.googlePlaceId || '');
      setOutletDietaryType(mess.dietaryType || 'PURE_VEG');
      setOutletFssai(mess.fssaiNumber || '');
      setOutletContactPhone((mess as any).contactPhone || '');
      setOutletContactEmail((mess as any).contactEmail || '');
      setOutletDeliveryRadiusKm(mess.deliveryRadiusKm || 3);
      if (mess.operatingHours) {
        setOutletLunchTiming(mess.operatingHours.lunch || '12:00 PM - 3:00 PM');
        setOutletDinnerTiming(mess.operatingHours.dinner || '7:30 PM - 10:30 PM');
      }
      if (mess.plans) {
        setPlansList(mess.plans);
      }
    }
  }, [mess]);

  // Sync profile state
  useEffect(() => {
    if (partnerProfile) {
      setBusinessName(partnerProfile.partner?.businessName || '');
      setContactPhone(partnerProfile.partner?.contactPhone || partnerProfile.user?.phone || '');
      setContactEmail(partnerProfile.partner?.contactEmail || partnerProfile.user?.email || '');
      setFssaiLicense(partnerProfile.partner?.fssaiLicense || '');
    }
  }, [partnerProfile]);

  // Mutation: Update Weekly Menu
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
      setMenuSuccess(true);
      setTimeout(() => setMenuSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['partner-mess'] });
    },
  });

  // Mutation: Save / Update Mess Outlet
  const saveOutletMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: outletName,
        description: outletDescription,
        address: {
          street: outletStreet,
          city: outletCity,
          state: outletState,
          pincode: outletPincode,
        },
        location: {
          type: 'Point' as const,
          coordinates: outletCoordinates,
        },
        googlePlaceId: outletGooglePlaceId || undefined,
        dietaryType: outletDietaryType,
        fssaiNumber: outletFssai,
        contactPhone: outletContactPhone,
        contactEmail: outletContactEmail,
        deliveryRadiusKm: Number(outletDeliveryRadiusKm),
        deliveryTimings: {
          breakfast: outletBreakfastTiming,
          lunch: outletLunchTiming,
          dinner: outletDinnerTiming,
        },
        operatingHours: {
          lunch: outletLunchTiming,
          dinner: outletDinnerTiming,
        },
      };

      if (mess?.id) {
        return apiClient<Mess>(`/mess/partner/outlet?messId=${mess.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        return apiClient<Mess>('/mess/partner/outlet', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      setOutletSuccess(true);
      setTimeout(() => setOutletSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['partner-mess'] });
    },
  });

  // Mutation: Save Meal Plans (Listing info only)
  const savePlansMutation = useMutation({
    mutationFn: () => {
      return apiClient<Mess>(`/mess/partner/plans?messId=${mess?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ plans: plansList }),
      });
    },
    onSuccess: () => {
      setPlansSuccess(true);
      setTimeout(() => setPlansSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['partner-mess'] });
    },
  });

  // Mutation: Decide Subscription Request (Accept / Reject)
  const decideSubMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      status,
      notes,
    }: {
      subscriptionId: string;
      status: SubscriptionStatus.ACCEPTED | SubscriptionStatus.REJECTED;
      notes?: string;
    }) => {
      return apiClient(`/mess/partner/subscriptions/${subscriptionId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ status, decisionNotes: notes }),
      });
    },
    onSuccess: () => {
      setRejectingSubId(null);
      setRejectionNotes('');
      queryClient.invalidateQueries({ queryKey: ['partner-subscribers'] });
    },
  });

  // Mutation: Save Partner Profile
  const saveProfileMutation = useMutation({
    mutationFn: () => {
      return apiClient('/mess/partner/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          businessName,
          contactPhone,
          contactEmail,
          fssaiLicense,
        }),
      });
    },
    onSuccess: () => {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['partner-profile'] });
    },
  });

  // Metrics computation (operational only, NO earnings)
  const pendingRequestsCount = subscribers.filter(
    (s) => (s.status as string) === 'REQUESTED' || (s.status as string) === 'PENDING',
  ).length;
  const activeSubscribersCount = subscribers.filter(
    (s) => (s.status as string) === 'ACCEPTED' || (s.status as string) === 'ACTIVE',
  ).length;

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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                  {mess?.name || 'Mess & Tiffin Partner Portal'}
                </h1>
                {mess?.approvalStatus === ApprovalStatus.APPROVED ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                    <CheckCircle2 className="w-3 h-3 text-[#21865B]" />
                    Admin Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F5A623]/15 text-[#102B50] border border-[#F5A623]/30">
                    <Clock className="w-3 h-3 text-[#F5A623]" />
                    Verification Pending
                  </span>
                )}
                {mess?.isPhysicallyVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#102B50] text-white">
                    <ShieldCheck className="w-3 h-3 text-[#F5A623]" />
                    Physically Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-[#687586] mt-0.5">
                Manage your mess outlet, daily rotating menus, monthly plans, and student dining requests.
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

        {/* Pending Role Approval Banner */}
        {user?.roleApprovalStatus && user.roleApprovalStatus !== 'APPROVED' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold block text-sm">
                Food Vendor Account Under Review ({user.roleApprovalStatus})
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Namaste {user.name}, your food vendor account is currently pending administrative verification. You may review your menus and outlet profile, but publishing your outlet and accepting dining subscription requests will be activated once your FSSAI registration and documentation are verified by the compliance team.
              </p>
            </div>
          </div>
        )}

        {/* Operational Metrics Bar (NO financial earnings, strictly operational) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-5 shadow-brand-sm space-y-1">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Active Subscribers
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-[#102B50]">{activeSubscribersCount}</p>
              <Users className="w-4 h-4 text-[#21865B]" />
            </div>
            <span className="text-[10px] text-[#687586]">Active dining passes</span>
          </div>

          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-5 shadow-brand-sm space-y-1">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Pending Requests
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-[#F5A623]">{pendingRequestsCount}</p>
              <Clock className="w-4 h-4 text-[#F5A623]" />
            </div>
            <span className="text-[10px] text-[#687586]">Awaiting vendor decision</span>
          </div>

          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-5 shadow-brand-sm space-y-1">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Delivery Coverage
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-[#102B50]">{outletDeliveryRadiusKm} km</p>
              <MapPin className="w-4 h-4 text-[#102B50]" />
            </div>
            <span className="text-[10px] text-[#687586]">Around outlet coordinates</span>
          </div>

          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-5 shadow-brand-sm space-y-1">
            <span className="text-[11px] font-bold text-[#687586] uppercase tracking-wider block">
              Dietary Certification
            </span>
            <p className="text-sm font-black text-[#102B50] mt-1 truncate">
              {mess?.dietaryType === 'PURE_VEG'
                ? '100% Pure Veg'
                : mess?.dietaryType === 'JAIN_AVAILABLE'
                  ? 'Satvik / Jain Options'
                  : 'Veg & Non-Veg'}
            </p>
            <span className="text-[10px] text-[#687586]">FSSAI: {mess?.fssaiNumber || 'Pending'}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E8E5DE] overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: Building },
            { id: 'outlet', label: 'My Outlet', icon: Building },
            { id: 'menu', label: 'Menu Management', icon: Calendar },
            { id: 'plans', label: 'Meal Plans', icon: FileText },
            { id: 'subscriptions', label: 'Orders', icon: ShoppingBag, badge: pendingRequestsCount },
            { id: 'qr', label: 'QR Meal Pass', icon: QrCode },
            { id: 'customers', label: 'Customers', icon: Users, badge: activeSubscribersCount },
            { id: 'earnings', label: 'Earnings', icon: Wallet },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'overview' && activeTab === 'overview') ||
              (tab.id === 'subscriptions' && activeTab === 'subscriptions');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${isActive
                    ? 'bg-[#102B50] text-white shadow-sm'
                    : 'text-[#687586] hover:text-[#102B50] hover:bg-white'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#F5A623] text-[#102B50] font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Subscription & Order Requests */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#F5A623]" />
                  <span>Student Subscription & Order Requests</span>
                </h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Review and accept or reject meal plan requests. Vendor acceptance registers the student pass; payment is not processed online.
                </p>
              </div>

              <div className="bg-[#FAF8F3] px-3 py-1.5 rounded-xl border border-[#E8E5DE] text-[11px] text-[#687586] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                <span>Status workflow: Requests $\to$ Accepted/Rejected (No payment collected)</span>
              </div>
            </div>

            {isSubsLoading ? (
              <div className="py-12 text-center text-xs text-[#687586]">
                Loading student meal plan requests...
              </div>
            ) : subscribers.length === 0 ? (
              <div className="p-12 border border-dashed border-[#E8E5DE] rounded-2xl text-center space-y-2 bg-[#FAF8F3]">
                <Utensils className="w-8 h-8 text-[#687586] mx-auto" />
                <p className="text-xs font-bold text-[#102B50]">No student subscription requests yet</p>
                <p className="text-[11px] text-[#687586] max-w-sm mx-auto">
                  Students living in nearby accommodations will discover your mess in the directory and submit meal plan subscription requests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscribers.map((sub) => {
                  const isRequested =
                    (sub.status as string) === 'REQUESTED' ||
                    (sub.status as string) === 'PENDING' ||
                    (sub.status as string) === 'PENDING_APPROVAL';
                  const isAccepted =
                    (sub.status as string) === 'ACCEPTED' ||
                    (sub.status as string) === 'ACTIVE';
                  const isRejected = (sub.status as string) === 'REJECTED';
                  const isCancelled = (sub.status as string) === 'CANCELLED';

                  return (
                    <div
                      key={sub.id}
                      className="p-5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-[#102B50] bg-white border border-[#E8E5DE] px-2.5 py-0.5 rounded-md">
                            {sub.subscriptionNumber || 'REQ'}
                          </span>
                          <span className="font-bold text-[#102B50] text-sm">
                            {sub.student?.name || 'Student Request'}
                          </span>

                          {/* Request Status Badge */}
                          {isRequested && (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#F5A623]/20 text-[#102B50] border border-[#F5A623]/30">
                              Decision Pending
                            </span>
                          )}
                          {isAccepted && (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                              Accepted by Vendor
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20">
                              Rejected
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#687586]/10 text-[#687586]">
                              Cancelled
                            </span>
                          )}
                        </div>

                        <div className="text-[#687586] flex flex-wrap items-center gap-3 text-[11px]">
                          <span>
                            Plan: <span className="font-bold text-[#102B50]">{sub.planName}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Diet: <span className="font-bold text-[#102B50]">{sub.dietaryPreference}</span>
                          </span>
                          {(sub as any).deliveryAddress?.street && (
                            <>
                              <span>•</span>
                              <span>
                                Delivery: <span className="font-bold text-[#102B50]">{(sub as any).deliveryAddress.street}</span>
                              </span>
                            </>
                          )}
                          {sub.student?.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-[#102B50]">
                                <Phone className="w-3 h-3 text-[#687586]" />
                                <span>{sub.student.phone}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {sub.decisionNotes && (
                          <p className="text-[11px] text-[#687586] bg-white p-2 rounded-xl border border-[#E8E5DE] inline-block">
                            <span className="font-bold text-[#102B50]">Vendor Note:</span> {sub.decisionNotes}
                          </p>
                        )}
                      </div>

                      {/* Right column: Informational Price & Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-left sm:text-right">
                          <span className="font-black text-sm text-[#102B50] block">
                            {formatCurrency(sub.monthlyPrice)} / mo
                          </span>
                          <span className="text-[10px] text-[#687586] block">
                            Listing reference price
                          </span>
                        </div>

                        {/* Decision actions for REQUESTED status */}
                        {isRequested && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                decideSubMutation.mutate({
                                  subscriptionId: sub.id,
                                  status: SubscriptionStatus.ACCEPTED,
                                })
                              }
                              disabled={decideSubMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B] transition shadow-xs disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => setRejectingSubId(sub.id)}
                              disabled={decideSubMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10 transition disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Rotating Weekly Menu Management */}
        {activeTab === 'menu' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5A623]" />
                  <span>Weekly Rotating Menu Schedule</span>
                </h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Update daily dishes for breakfast, lunch, snacks, and dinner to notify student subscribers.
                </p>
              </div>

              {menuSuccess && (
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${selectedDay === day
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    Evening Snacks ({selectedDay})
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Vegetable Cutlets + Masala Chai"
                    value={menuSnacks}
                    onChange={(e) => setMenuSnacks(e.target.value)}
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
                  placeholder="e.g. Jain preparation available on advance order / Sunday Special Feast"
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
        )}

        {/* TAB 3: Outlet Setup & Media */}
        {activeTab === 'outlet' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#F5A623]" />
                    <span>Mess Outlet Configuration</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Configure your service name, location coordinates, delivery coverage radius, and timings.
                  </p>
                </div>

                {outletSuccess && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#21865B] bg-[#21865B]/10 border border-[#21865B]/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                    <span>Outlet Saved Successfully!</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#102B50] mb-1">Outlet / Service Name *</label>
                  <input
                    type="text"
                    required
                    value={outletName}
                    onChange={(e) => setOutletName(e.target.value)}
                    placeholder="e.g. Annapurna Homestyle Mess & Tiffin"
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">Dietary Classification *</label>
                  <select
                    value={outletDietaryType}
                    onChange={(e) => setOutletDietaryType(e.target.value)}
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  >
                    <option value="PURE_VEG">100% Pure Vegetarian</option>
                    <option value="JAIN_AVAILABLE">Satvik / Jain Options Available</option>
                    <option value="VEG_NON_VEG">Vegetarian & Non-Vegetarian</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#102B50] mb-1">Service Description</label>
                  <textarea
                    rows={2}
                    value={outletDescription}
                    onChange={(e) => setOutletDescription(e.target.value)}
                    placeholder="Describe your kitchen hygiene, culinary style, flour quality, and delivery service..."
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={outletStreet}
                    onChange={(e) => setOutletStreet(e.target.value)}
                    placeholder="e.g. 42 Vigyan Nagar Main Road"
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={outletCity}
                    onChange={(e) => setOutletCity(e.target.value)}
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">State & Pincode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={outletState}
                      onChange={(e) => setOutletState(e.target.value)}
                      placeholder="Rajasthan"
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                    />
                    <input
                      type="text"
                      value={outletPincode}
                      onChange={(e) => setOutletPincode(e.target.value)}
                      placeholder="324005"
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">FSSAI License Number</label>
                  <input
                    type="text"
                    value={outletFssai}
                    onChange={(e) => setOutletFssai(e.target.value)}
                    placeholder="14-digit FSSAI License Number"
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">Delivery Coverage Radius (km)</label>
                  <input
                    type="number"
                    min={0.5}
                    max={25}
                    step={0.5}
                    value={outletDeliveryRadiusKm}
                    onChange={(e) => setOutletDeliveryRadiusKm(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102B50] mb-1">Contact Phone & Email</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={outletContactPhone}
                      onChange={(e) => setOutletContactPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                    />
                    <input
                      type="email"
                      value={outletContactEmail}
                      onChange={(e) => setOutletContactEmail(e.target.value)}
                      placeholder="mess@example.com"
                      className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#102B50] mb-1">Delivery Timings</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-[#687586] block">Breakfast Window</span>
                      <input
                        type="text"
                        value={outletBreakfastTiming}
                        onChange={(e) => setOutletBreakfastTiming(e.target.value)}
                        className="w-full p-2 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#687586] block">Lunch Window</span>
                      <input
                        type="text"
                        value={outletLunchTiming}
                        onChange={(e) => setOutletLunchTiming(e.target.value)}
                        className="w-full p-2 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#687586] block">Dinner Window</span>
                      <input
                        type="text"
                        value={outletDinnerTiming}
                        onChange={(e) => setOutletDinnerTiming(e.target.value)}
                        className="w-full p-2 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Geographic Coordinates Picker */}
              <div className="pt-2 border-t border-[#E8E5DE]">
                <LocationPicker
                  coordinates={outletCoordinates}
                  onChange={(newCoords: [number, number]) => {
                    setOutletCoordinates(newCoords);
                  }}
                  label="Mess Location Source of Truth (Latitude & Longitude)"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => saveOutletMutation.mutate()}
                  disabled={saveOutletMutation.isPending || !outletName || !outletStreet}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveOutletMutation.isPending ? 'Saving Outlet...' : 'Save Outlet Settings'}</span>
                </button>
              </div>
            </div>

            {/* Media Uploads Section */}
            {mess?.id && (
              <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-4">
                <div>
                  <h3 className="text-base font-black text-[#102B50]">
                    Mess & Food Photographs
                  </h3>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Upload dining hall photos, kitchen hygiene proofs, and dish thali samples. Uploaded photos are reviewed by admin.
                  </p>
                </div>

                <MediaUploader
                  relatedEntityType="MESS"
                  relatedEntityId={mess.id}
                  category="MESS_PHOTOS"
                  maxFiles={12}
                  allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Meal Plans (Listing info only) */}
        {activeTab === 'plans' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#F5A623]" />
                  <span>Monthly Meal Plans Management</span>
                </h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Configure your monthly dining options. Prices are displayed to students as listing information only; no payments are processed online.
                </p>
              </div>

              {plansSuccess && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#21865B] bg-[#21865B]/10 border border-[#21865B]/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                  <span>Meal Plans Saved!</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {plansList.map((plan, idx) => (
                <div
                  key={plan.id || idx}
                  className="p-5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#102B50]">Plan #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPlansList(plansList.filter((_, i) => i !== idx));
                      }}
                      className="text-[#D64545] hover:text-[#D64545]/80 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#102B50] mb-1">Plan Name *</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          const updated = [...plansList];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = { ...cur, id: cur.id || `plan_${idx}`, name: e.target.value };
                          setPlansList(updated);
                        }}
                        placeholder="e.g. Both Times Thali (Lunch + Dinner)"
                        className="w-full p-2 border border-[#E8E5DE] rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#102B50] mb-1">
                        Monthly Listed Price (INR) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={plan.monthlyPrice}
                        onChange={(e) => {
                          const updated = [...plansList];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = { ...cur, id: cur.id || `plan_${idx}`, monthlyPrice: Number(e.target.value) };
                          setPlansList(updated);
                        }}
                        className="w-full p-2 border border-[#E8E5DE] rounded-xl bg-white"
                      />
                      <span className="text-[10px] text-[#687586]">Displayed as listing info only</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#102B50] mb-1">Description</label>
                      <input
                        type="text"
                        value={plan.description || ''}
                        onChange={(e) => {
                          const updated = [...plansList];
                          const cur = updated[idx];
                          if (!cur) return;
                          updated[idx] = { ...cur, id: cur.id || `plan_${idx}`, description: e.target.value };
                          setPlansList(updated);
                        }}
                        placeholder="e.g. 2 Meals daily + Sunday sweet dish"
                        className="w-full p-2 border border-[#E8E5DE] rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  {/* Meals Included Checkboxes */}
                  <div>
                    <span className="block text-[11px] font-bold text-[#102B50] mb-1.5">Meals Included:</span>
                    <div className="flex flex-wrap gap-4 text-xs text-[#263445]">
                      {[
                        { key: 'BREAKFAST' as const, label: 'Breakfast' },
                        { key: 'LUNCH' as const, label: 'Lunch' },
                        { key: 'SNACKS' as const, label: 'Snacks' },
                        { key: 'DINNER' as const, label: 'Dinner' },
                      ].map((meal) => {
                        const isIncluded = (plan.mealTypes || []).includes(meal.key);
                        return (
                          <label key={meal.key} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={(e) => {
                                const updated = [...plansList];
                                const cur = updated[idx];
                                if (!cur) return;
                                const currentTypes = cur.mealTypes || [];
                                const newTypes = e.target.checked
                                  ? [...currentTypes, meal.key]
                                  : currentTypes.filter((t) => t !== meal.key);
                                updated[idx] = {
                                  ...cur,
                                  id: cur.id || `plan_${idx}`,
                                  mealTypes: newTypes,
                                };
                                setPlansList(updated);
                              }}
                              className="rounded border-[#E8E5DE] text-[#F5A623] focus:ring-[#F5A623]"
                            />
                            <span>{meal.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPlansList([
                    ...plansList,
                    {
                      id: `plan_${Date.now()}`,
                      name: '',
                      description: '',
                      daysPerWeek: 7,
                      monthlyPrice: 3000,
                      mealTypes: ['LUNCH', 'DINNER'],
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] border border-[#E8E5DE] hover:border-[#102B50] transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Add Another Meal Plan</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E8E5DE]">
              <button
                onClick={() => savePlansMutation.mutate()}
                disabled={savePlansMutation.isPending || plansList.length === 0}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savePlansMutation.isPending ? 'Saving Plans...' : 'Save Meal Plans'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: Vendor Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#F5A623]" />
                  <span>Vendor Partner Profile</span>
                </h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Manage your business entity, food business registration, and official partner contact details.
                </p>
              </div>

              {profileSuccess && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#21865B] bg-[#21865B]/10 border border-[#21865B]/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                  <span>Profile Saved!</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#102B50] mb-1">Business / Trade Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Annapurna Caterers & Tiffin LLP"
                  className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102B50] mb-1">FSSAI License / Registration</label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  placeholder="14-digit FSSAI Number"
                  className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102B50] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102B50] mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full p-2.5 border border-[#E8E5DE] rounded-xl bg-[#FAF8F3]/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E8E5DE]">
              <button
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveProfileMutation.isPending ? 'Saving...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: QR Meal Pass */}
        {activeTab === 'qr' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-extrabold text-[#102B50]">Digital QR Meal Pass Validation</h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Scan and validate student dining passes for breakfast, lunch, and dinner.
                </p>
              </div>
              <span className="text-xs font-bold text-[#102B50] px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E8E5DE]">
                Live Terminal
              </span>
            </div>
            <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center space-y-2">
              <QrCode className="w-10 h-10 text-[#102B50] mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-[#102B50]">Camera & QR Scanner Ready</h3>
              <p className="text-xs text-[#687586] max-w-md mx-auto">
                Students scan or display their active meal pass QR code from the Apna Ghar student app for touchless meal verification.
              </p>
            </div>
          </div>
        )}

        {/* TAB: Customers */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-extrabold text-[#102B50]">Subscribed Students & Dining Customers</h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Customer roster, dietary preferences, and meal plan statuses.
                </p>
              </div>
              <span className="text-xs font-bold text-[#21865B] px-3 py-1 rounded-full bg-[#EBF7EE]">
                {activeSubscribersCount} Active Subscribers
              </span>
            </div>
            <div className="space-y-3">
              {subscribers.filter((s) => s.status === 'ACCEPTED' || (s.status as string) === 'ACTIVE').length > 0 ? (
                subscribers
                  .filter((s) => s.status === 'ACCEPTED' || (s.status as string) === 'ACTIVE')
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#102B50]">
                          {(sub as any).studentId?.name || 'Verified Student Member'}
                        </p>
                        <p className="text-[11px] text-[#687586]">
                          {(sub as any).studentId?.phone || (sub as any).planType || 'Monthly Dining Pass'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#102B50] text-white">
                        Active Dining Member
                      </span>
                    </div>
                  ))
              ) : (
                <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center space-y-2">
                  <Users className="w-8 h-8 text-[#102B50] mx-auto opacity-70" />
                  <p className="text-xs text-[#687586]">No active dining subscribers yet. Approved student subscriptions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Earnings */}
        {activeTab === 'earnings' && (
          <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-brand-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
              <div>
                <h2 className="text-base font-extrabold text-[#102B50]">Vendor Earnings & Settlements</h2>
                <p className="text-xs text-[#687586] mt-0.5">
                  Subscription plan inflows, platform fee breakdown, and weekly disbursements.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE]">
                <span className="text-xs font-semibold text-[#687586]">Active Dining Subscribers</span>
                <p className="text-2xl font-black text-[#102B50] mt-1">{activeSubscribersCount}</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE]">
                <span className="text-xs font-semibold text-[#687586]">Pending Inflow</span>
                <p className="text-2xl font-black text-[#F5A623] mt-1">{pendingRequestsCount} orders</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE]">
                <span className="text-xs font-semibold text-[#687586]">Payout Status</span>
                <p className="text-sm font-bold text-[#102B50] mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#21865B]" />
                  Weekly Settlement Active
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Rejection Reason */}
        {rejectingSubId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E5DE] space-y-4">
              <div className="flex items-center gap-2 text-[#D64545]">
                <XCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-[#102B50]">Reject Subscription Request</h3>
              </div>
              <p className="text-xs text-[#687586] leading-relaxed">
                Provide a reason for rejecting this student subscription request (e.g. delivery area out of reach, kitchen capacity full).
              </p>

              <div>
                <label className="text-xs font-bold text-[#102B50] block mb-1.5">
                  Reason for rejection
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Outside 3km delivery radius"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-[#E8E5DE] text-[#263445] bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#D64545]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setRejectingSubId(null);
                    setRejectionNotes('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#687586] hover:bg-[#FAF8F3] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    decideSubMutation.mutate({
                      subscriptionId: rejectingSubId,
                      status: SubscriptionStatus.REJECTED,
                      notes: rejectionNotes,
                    })
                  }
                  disabled={decideSubMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D64545] hover:bg-[#D64545]/90 transition disabled:opacity-50"
                >
                  {decideSubMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}

export default function MessPartnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F3] py-12 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-bold text-[#102B50]">
            <Clock className="w-4 h-4 animate-spin text-[#F5A623]" />
            Loading Food Vendor Portal...
          </div>
        </div>
      }
    >
      <MessPartnerDashboardInner />
    </Suspense>
  );
}
