'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  Calendar,
  Home,
  Wrench,
  Users,
  QrCode,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  BedDouble,
  CreditCard,
  X,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  UserRole,
  Booking,
  BookingStatus,
  Visit,
  MaintenanceTicket,
  TicketCategory,
  TicketPriority,
  RoommatePreferences,
  MessSubscription,
} from '@apna-ghar/shared-types';

export default function StudentDashboardPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  // Modal & Form States
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketPropertyId, setTicketPropertyId] = useState('');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('PLUMBING');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('MEDIUM');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketError, setTicketError] = useState('');

  // Roommate Preferences Edit Mode State
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [prefSleep, setPrefSleep] = useState<'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE'>('FLEXIBLE');
  const [prefFood, setPrefFood] = useState<'VEG' | 'NON_VEG' | 'VEGAN' | 'EGGETARIAN' | 'ANY'>('ANY');
  const [prefCleanliness, setPrefCleanliness] = useState<'STRICT' | 'MODERATE' | 'CASUAL'>('MODERATE');
  const [prefStudy, setPrefStudy] = useState<'SILENT' | 'GROUP' | 'MUSIC_OK'>('SILENT');
  const [prefSmoking, setPrefSmoking] = useState(false);
  const [prefHobbiesStr, setPrefHobbiesStr] = useState('');

  // 1. Fetch Student Bookings
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['student-bookings'],
    queryFn: () => apiClient<Booking[]>('/bookings/student'),
    enabled: isAuthenticated,
  });

  // 2. Fetch Student Visits
  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ['student-visits'],
    queryFn: () => apiClient<Visit[]>('/visits/student'),
    enabled: isAuthenticated,
  });

  // 3. Fetch Maintenance Tickets
  const { data: tickets = [] } = useQuery<MaintenanceTicket[]>({
    queryKey: ['student-tickets'],
    queryFn: () => apiClient<MaintenanceTicket[]>('/tickets/student'),
    enabled: isAuthenticated,
  });

  // 4. Fetch Roommate Preferences
  const { data: preferences } = useQuery<RoommatePreferences>({
    queryKey: ['roommate-preferences'],
    queryFn: () => apiClient<RoommatePreferences>('/users/roommate-preferences'),
    enabled: isAuthenticated,
  });

  // 5. Fetch Student Mess Subscriptions
  const { data: messSubscriptions = [] } = useQuery<MessSubscription[]>({
    queryKey: ['student-mess-subscriptions'],
    queryFn: () => apiClient<MessSubscription[]>('/mess/subscriptions/student'),
    enabled: isAuthenticated,
  });

  // Populate preference edit state when data arrives
  React.useEffect(() => {
    if (preferences) {
      setPrefSleep(preferences.sleepSchedule || 'FLEXIBLE');
      setPrefFood(preferences.foodPreference || 'ANY');
      setPrefCleanliness(preferences.cleanlinessLevel || 'MODERATE');
      setPrefStudy(preferences.studyHabits || 'SILENT');
      setPrefSmoking(!!preferences.smoking);
      setPrefHobbiesStr(preferences.hobbies?.join(', ') || '');
    }
  }, [preferences]);

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: () =>
      apiClient<MaintenanceTicket>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: ticketPropertyId,
          category: ticketCategory,
          priority: ticketPriority,
          title: ticketTitle,
          description: ticketDesc,
        }),
      }),
    onSuccess: () => {
      setIsTicketModalOpen(false);
      setTicketTitle('');
      setTicketDesc('');
      setTicketError('');
      queryClient.invalidateQueries({ queryKey: ['student-tickets'] });
    },
    onError: (err: any) => {
      setTicketError(err?.message || 'Failed to submit maintenance ticket');
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: (ticketId: string) =>
      apiClient<MaintenanceTicket>(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'CLOSED',
          resolutionNotes: 'Closed by student from dashboard',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tickets'] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: () => {
      const hobbies = prefHobbiesStr
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);

      return apiClient<RoommatePreferences>('/users/roommate-preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          sleepSchedule: prefSleep,
          foodPreference: prefFood,
          cleanlinessLevel: prefCleanliness,
          studyHabits: prefStudy,
          smoking: prefSmoking,
          hobbies,
        }),
      });
    },
    onSuccess: () => {
      setIsEditingPreferences(false);
      queryClient.invalidateQueries({ queryKey: ['roommate-preferences'] });
    },
  });

  const confirmedBooking = bookings.find((b) => b.status === BookingStatus.CONFIRMED);
  const pendingBooking = bookings.find((b) => b.status === BookingStatus.PENDING_PAYMENT);

  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Active Stay';
    if (diffDays === 0) return 'Move-In Today!';
    if (diffDays === 1) return 'Move-In Tomorrow';
    return `Move-In in ${diffDays} days`;
  };

  return (
    <AuthGuard allowedRoles={[UserRole.STUDENT]}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DCE8E2] text-[#173327] flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#173327] tracking-tight">
                  Welcome, {user?.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-[#3D3A33] mt-0.5">
                Student Living Hub • Contact: {user?.phone || user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition shadow-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Explore Stays</span>
            </Link>
            <Link
              href="/student/bookings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-[#ECE8DD] hover:bg-slate-50 transition shadow-xs"
            >
              <span>All Bookings ({bookings.length})</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1: Active Confirmed Stay Hero / Notification */}
        {confirmedBooking ? (
          <div className="bg-gradient-to-br from-[#173327] to-[#1F4333] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
              <Building className="w-72 h-72 text-white" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{getDaysUntil(confirmedBooking.moveInDate)}</span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {confirmedBooking.property?.name || 'Your Confirmed Student Stay'}
                  </h2>
                  <p className="text-xs text-emerald-100 mt-1 flex items-center gap-2">
                    <span>Room {confirmedBooking.room?.roomNumber || '—'}</span>
                    <span>•</span>
                    <span className="font-semibold">{confirmedBooking.bed?.bedLabel || 'Bed'}</span>
                    <span>•</span>
                    <span>Ref: {confirmedBooking.bookingReference}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Move-In Date:{' '}
                      {new Date(confirmedBooking.moveInDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Paid: {formatCurrency(confirmedBooking.totalInitialPayment)}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <Link
                  href={`/student/bookings/${confirmedBooking.id}/pass`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-lg transition"
                >
                  <QrCode className="w-4 h-4 text-slate-900" />
                  <span>View Digital Move-In Pass</span>
                </Link>

                <button
                  onClick={() => {
                    setTicketPropertyId(confirmedBooking.propertyId);
                    setIsTicketModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-200 bg-white/10 hover:bg-white/20 transition"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Report Maintenance Issue</span>
                </button>
              </div>
            </div>
          </div>
        ) : pendingBooking ? (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Clock className="w-4 h-4 animate-pulse text-amber-600" />
                <span>Temporary Hold Active • Payment Pending</span>
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Complete payment for {pendingBooking.property?.name || 'your reserved bed'}
              </h3>
              <p className="text-xs text-slate-600">
                Reference: <span className="font-mono font-semibold">{pendingBooking.bookingReference}</span> • Amount:{' '}
                <span className="font-bold text-slate-900">{formatCurrency(pendingBooking.totalInitialPayment)}</span>
              </p>
            </div>
            <Link
              href={`/student/bookings/${pendingBooking.id}/pay`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>Complete Payment</span>
            </Link>
          </div>
        ) : (
          /* Lock 4 Compliant Empty Accommodation State */
          <div className="bg-white border border-[#ECE8DD] rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <BedDouble className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#173327]">No Active Accommodations</h3>
              <p className="text-xs text-[#3D3A33] leading-relaxed">
                You do not have any active or confirmed hostel bookings yet. Browse verified properties near your college and reserve your exact bed.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
            >
              <span>Explore Verified PGs & Hostels</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* SECTION 2: Grid for Maintenance Tickets & Roommate Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Support & Maintenance Tickets Card */}
          <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#173327] flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#173327]">Maintenance Tickets</h2>
                    <p className="text-[11px] text-slate-500">Track plumbing, electrical, and facility repair requests</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirmedBooking) {
                      setTicketPropertyId(confirmedBooking.propertyId);
                    }
                    setIsTicketModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise Ticket</span>
                </button>
              </div>

              {/* Tickets List or Lock 4 Empty State */}
              {tickets.length === 0 ? (
                <div className="p-8 border border-dashed border-[#DDD7C7] rounded-2xl text-center space-y-2 bg-[#FCFBF7]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-900">No active maintenance tickets</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    All room fixtures and utilities are running smoothly. Click &quot;Raise Ticket&quot; anytime an issue occurs.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {tickets.map((ticket) => {
                    const isOpen = ticket.status === 'OPEN';
                    const isInProgress = ticket.status === 'IN_PROGRESS';
                    const isResolved = ticket.status === 'RESOLVED';

                    return (
                      <div
                        key={ticket.id}
                        className="p-3.5 rounded-xl border border-[#ECE8DD] bg-[#FCFBF7] space-y-2 hover:border-[#173327]/30 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {ticket.title}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              isOpen
                                ? 'bg-blue-50 text-blue-700'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-700'
                                : isResolved
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">{ticket.description}</p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>
                            {ticket.category} • Priority: {ticket.priority}
                          </span>

                          {isResolved && (
                            <button
                              onClick={() => closeTicketMutation.mutate(ticket.id)}
                              disabled={closeTicketMutation.isPending}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
                            >
                              Close Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 bg-[#FCFBF7] p-3 rounded-xl border border-[#ECE8DD]">
              All tickets are timestamped and assigned directly to the property warden with 24-hour SLA tracking.
            </div>
          </div>

          {/* Roommate Preferences Compatibility Card */}
          <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#173327] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#173327]">Roommate Compatibility</h2>
                    <p className="text-[11px] text-slate-500">Matching criteria for shared rooms & flatmates</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingPreferences(!isEditingPreferences)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#173327] bg-[#DCE8E2] hover:bg-[#c8ded4] transition"
                >
                  {isEditingPreferences ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditingPreferences ? (
                /* Edit Form */
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sleep Schedule</label>
                      <select
                        value={prefSleep}
                        onChange={(e) => setPrefSleep(e.target.value as any)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="EARLY_BIRD">Early Bird (Morning)</option>
                        <option value="NIGHT_OWL">Night Owl (Late Night)</option>
                        <option value="FLEXIBLE">Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Diet Preference</label>
                      <select
                        value={prefFood}
                        onChange={(e) => setPrefFood(e.target.value as any)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="VEG">Vegetarian</option>
                        <option value="NON_VEG">Non-Vegetarian</option>
                        <option value="EGGETARIAN">Eggetarian</option>
                        <option value="VEGAN">Vegan</option>
                        <option value="ANY">Any / No Restriction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Cleanliness</label>
                      <select
                        value={prefCleanliness}
                        onChange={(e) => setPrefCleanliness(e.target.value as any)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="STRICT">Strict (Always tidy)</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="CASUAL">Casual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Study Habits</label>
                      <select
                        value={prefStudy}
                        onChange={(e) => setPrefStudy(e.target.value as any)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="SILENT">Pin-drop Silent</option>
                        <option value="GROUP">Group Study</option>
                        <option value="MUSIC_OK">Background Music OK</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hobbies & Interests (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Coding, Football, Guitar, Chess"
                      value={prefHobbiesStr}
                      onChange={(e) => setPrefHobbiesStr(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="prefSmoking"
                      checked={prefSmoking}
                      onChange={(e) => setPrefSmoking(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <label htmlFor="prefSmoking" className="text-xs text-slate-700">
                      Smoker / Smoking Tolerant
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingPreferences(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updatePreferencesMutation.mutate()}
                      disabled={updatePreferencesMutation.isPending}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                    >
                      {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Display View */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD]">
                      <span className="text-[11px] text-slate-500 block">Sleep Schedule</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {prefSleep === 'EARLY_BIRD'
                          ? 'Early Bird (Morning)'
                          : prefSleep === 'NIGHT_OWL'
                          ? 'Night Owl (Late)'
                          : 'Flexible'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD]">
                      <span className="text-[11px] text-slate-500 block">Dietary Habit</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{prefFood}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD]">
                      <span className="text-[11px] text-slate-500 block">Cleanliness</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{prefCleanliness}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD]">
                      <span className="text-[11px] text-slate-500 block">Study Environment</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{prefStudy}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                      Interests & Hobbies
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {preferences?.hobbies && preferences.hobbies.length > 0 ? (
                        preferences.hobbies.map((h, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#DCE8E2] text-[#173327]"
                          >
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No hobbies added yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 bg-[#FCFBF7] p-3 rounded-xl border border-[#ECE8DD]">
              These preferences help match you with compatible room partners during room allocation.
            </div>
          </div>
        </div>

        {/* SECTION 3: Scheduled Visits Summary Widget */}
        <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#173327]" />
              <h2 className="text-sm font-bold text-[#173327]">Scheduled Property Visits</h2>
            </div>
            <Link
              href="/student/visits"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
            >
              View All ({visits.length})
            </Link>
          </div>

          {visits.length === 0 ? (
            <div className="p-8 border border-dashed border-[#DDD7C7] rounded-2xl text-center space-y-2 bg-[#FCFBF7]">
              <p className="text-xs font-semibold text-[#173327]">No property visits scheduled yet.</p>
              <p className="text-[11px] text-[#3D3A33] max-w-sm mx-auto">
                Schedule in-person campus visits to inspect rooms, meet property wardens, and check inventory.
              </p>
              <div className="pt-2">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                >
                  Schedule A Visit
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visits.slice(0, 3).map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 rounded-2xl border border-[#ECE8DD] bg-[#FCFBF7] space-y-2 hover:border-[#173327]/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {visit.property?.name || 'Property Visit'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {visit.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(visit.scheduledAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      • {visit.slot || 'Confirmed Slot'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Mess & Meal Plan Subscriptions */}
        <div className="bg-white border border-[#ECE8DD] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#173327]" />
              <h2 className="text-sm font-bold text-[#173327]">Campus Dining & Meal Subscriptions</h2>
            </div>
            <Link
              href="/mess"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
            >
              Browse Mess Directory
            </Link>
          </div>

          {messSubscriptions.length === 0 ? (
            <div className="p-8 border border-dashed border-[#DDD7C7] rounded-2xl text-center space-y-2 bg-[#FCFBF7]">
              <p className="text-xs font-semibold text-[#173327]">No active meal plan subscriptions.</p>
              <p className="text-[11px] text-[#3D3A33] max-w-sm mx-auto">
                Subscribe to verified pure veg, Jain, or multi-cuisine mess plans near your campus with daily rotating menus.
              </p>
              <div className="pt-2">
                <Link
                  href="/mess"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                >
                  Explore Mess Plans
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-[#ECE8DD] bg-[#FCFBF7] space-y-2.5 text-xs hover:border-[#173327]/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">
                      {sub.mess?.name || 'Student Mess'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {sub.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Plan: <span className="font-semibold text-slate-900">{sub.planName}</span></span>
                    <span>Diet: <span className="font-semibold text-slate-900">{sub.dietaryPreference}</span></span>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-mono flex items-center justify-between">
                    <span className="truncate pr-2">{sub.qrPassCode}</span>
                    <span className="text-emerald-400 font-bold shrink-0">
                      Valid Till {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Raise Maintenance Ticket Modal */}
        {isTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#173327]">
                  <Wrench className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-base">Raise Maintenance Request</h3>
                </div>
                <button
                  onClick={() => setIsTicketModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {ticketError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ticketError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Accommodation / Property
                  </label>
                  <select
                    value={ticketPropertyId}
                    onChange={(e) => setTicketPropertyId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="">-- Choose Property --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.propertyId}>
                        {b.property?.name || 'My Hostel'} (Room {b.room?.roomNumber || '—'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    >
                      <option value="PLUMBING">Plumbing / Water</option>
                      <option value="ELECTRICAL">Electrical / Lighting</option>
                      <option value="FURNITURE">Furniture / Bed / Desk</option>
                      <option value="CLEANING">Housekeeping / Cleaning</option>
                      <option value="WIFI">Wi-Fi / Internet</option>
                      <option value="OTHER">Other Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="EMERGENCY">Emergency (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Geyser not heating or tap leaking"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    placeholder="Please specify room number, fixture location, and issue details..."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!ticketPropertyId) {
                      setTicketError('Please select a property.');
                      return;
                    }
                    if (!ticketTitle.trim() || !ticketDesc.trim()) {
                      setTicketError('Please enter both title and description.');
                      return;
                    }
                    createTicketMutation.mutate();
                  }}
                  disabled={createTicketMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition disabled:opacity-50"
                >
                  {createTicketMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
