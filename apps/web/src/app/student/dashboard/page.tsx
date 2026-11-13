'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building,
  Calendar,
  CreditCard,
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  BedDouble,
  Utensils,
  QrCode,
  MapPin,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { UserRole, Booking, BookingStatus, VisitStatus } from '@apna-ghar/shared-types';
import { ScrollHeroAnimation } from '@/components/home/scroll-hero-animation';

interface StudentVisit {
  id: string;
  propertyId: {
    name: string;
    slug: string;
    address?: {
      street: string;
      city: string;
    };
  };
  scheduledAt: string;
  slot: string;
  status: VisitStatus;
}

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['student-bookings'],
    queryFn: () => apiClient<Booking[]>('/bookings/student'),
    enabled: !!user,
  });

  const { data: visits = [], isLoading: isVisitsLoading } = useQuery<StudentVisit[]>({
    queryKey: ['student-visits'],
    queryFn: () => apiClient<StudentVisit[]>('/visits/student'),
    enabled: !!user,
  });

  const { data: preferences } = useQuery<any>({
    queryKey: ['roommate-preferences'],
    queryFn: () => apiClient<any>('/users/roommate-preferences'),
    enabled: !!user,
  });

  const activeBooking = bookings.find(
    (b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING_PAYMENT,
  );

  const upcomingVisits = visits.filter(
    (v) => v.status === VisitStatus.CONFIRMED || v.status === VisitStatus.REQUESTED,
  );

  return (
    <AuthGuard allowedRoles={[UserRole.STUDENT, UserRole.ADMIN, UserRole.OWNER]}>
      {/* Full-width 3D Scrolling Animation Hero (Identical to Home Page) */}
      <ScrollHeroAnimation />

      <div id="student-dashboard-content" className="scroll-mt-12" />

      <div className="min-h-screen bg-[#FAF8F3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center text-2xl font-black shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                    Welcome back, {user?.name || 'Student'}!
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#21865B] border border-[#21865B]/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Student
                  </span>
                </div>
                <p className="text-xs text-[#687586] mt-1">
                  Har Sahar Apna Ghar — Manage your room reservations, property visits, and living preferences.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition shadow-sm"
              >
                <Search className="w-4 h-4" />
                Find Stays
              </Link>
              <Link
                href="/mess"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#102B50] bg-[#FAF8F3] hover:bg-[#E8E5DE] border border-[#E8E5DE] transition"
              >
                <Utensils className="w-4 h-4" />
                Mess Plans
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#687586]">Active Bookings</span>
                <p className="text-2xl font-black text-[#102B50] mt-1">{bookings.length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#102B50]/10 text-[#102B50] flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#687586]">Scheduled Visits</span>
                <p className="text-2xl font-black text-[#102B50] mt-1">{upcomingVisits.length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#F5A623]/15 text-[#E06D3B] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#687586]">Trust Passport Guarantee</span>
                <p className="text-xs font-bold text-[#21865B] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 7-Point Verified Stays
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#21865B]/10 text-[#21865B] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Active Bookings & Visits (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Accommodation Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E5DE] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-[#102B50]" />
                    <h2 className="text-sm font-black text-[#102B50] uppercase tracking-wider">
                      My Accommodation Booking
                    </h2>
                  </div>
                  <Link
                    href="/student/bookings"
                    className="text-xs font-bold text-[#F5A623] hover:text-[#E99A12] flex items-center gap-1"
                  >
                    View All ({bookings.length})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {isBookingsLoading ? (
                  <div className="py-8 text-center text-xs text-[#687586] flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Loading your reservations...
                  </div>
                ) : activeBooking ? (
                  <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#102B50]">
                          {(activeBooking as any).propertyId?.name || 'Verified Student Hostel'}
                        </span>
                        <p className="text-[11px] text-[#687586] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {(activeBooking as any).propertyId?.address?.city || 'Near College Campus'}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-[11px] font-bold px-3 py-1 rounded-full bg-[#EBF7EE] text-[#21865B]">
                        Status: {activeBooking.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#E8E5DE] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#687586]">
                        Monthly Rent: <strong className="text-[#102B50]">{formatCurrency(activeBooking.rentAmount || activeBooking.totalInitialPayment || 0)}</strong>
                      </span>
                      <Link
                        href={`/student/bookings/${activeBooking.id || (activeBooking as any)._id}/pass`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#F5A623]" />
                        Move-in Pass
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center space-y-3">
                    <p className="text-xs text-[#687586]">
                      You don't have an active accommodation booking yet.
                    </p>
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Browse Verified PGs & Hostels
                    </Link>
                  </div>
                )}
              </div>

              {/* Scheduled Property Visits Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E5DE] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#102B50]" />
                    <h2 className="text-sm font-black text-[#102B50] uppercase tracking-wider">
                      Upcoming Property Visits
                    </h2>
                  </div>
                  <Link
                    href="/student/visits"
                    className="text-xs font-bold text-[#F5A623] hover:text-[#E99A12] flex items-center gap-1"
                  >
                    Manage Visits
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {isVisitsLoading ? (
                  <div className="py-8 text-center text-xs text-[#687586] flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Loading scheduled visits...
                  </div>
                ) : upcomingVisits.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingVisits.slice(0, 3).map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#102B50]">{v.propertyId?.name}</p>
                          <p className="text-[11px] text-[#687586] flex items-center gap-2 mt-0.5">
                            <span>📅 {new Date(v.scheduledAt).toLocaleDateString()}</span>
                            <span>⏰ {v.slot}</span>
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#102B50]/10 text-[#102B50]">
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center space-y-2">
                    <p className="text-xs text-[#687586]">No upcoming property visits scheduled.</p>
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#102B50] hover:underline"
                    >
                      Schedule a physical visit before booking →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Roommate Preferences & Shortcuts */}
            <div className="space-y-6">
              {/* Roommate Preferences Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E5DE] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#102B50]" />
                  <h3 className="text-sm font-black text-[#102B50] uppercase tracking-wider">
                    Roommate Matching
                  </h3>
                </div>
                <p className="text-xs text-[#687586]">
                  Your lifestyle preferences help Apna Ghar recommend the best room and flatmate matches.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#E8E5DE]">
                    <span className="text-[#687586]">Sleep Schedule:</span>
                    <strong className="text-[#102B50]">{preferences?.sleepSchedule || 'Flexible'}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E8E5DE]">
                    <span className="text-[#687586]">Food Preference:</span>
                    <strong className="text-[#102B50]">{preferences?.foodPreference || 'Any'}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E8E5DE]">
                    <span className="text-[#687586]">Study Environment:</span>
                    <strong className="text-[#102B50]">{preferences?.studyHabits || 'Silent'}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#687586]">Cleanliness Level:</span>
                    <strong className="text-[#102B50]">{preferences?.cleanlinessLevel || 'Moderate'}</strong>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E5DE] shadow-sm space-y-3">
                <h3 className="text-xs font-black text-[#102B50] uppercase tracking-wider mb-2">
                  Quick Shortcuts
                </h3>
                <Link
                  href="/search"
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF8F3] transition text-xs font-bold text-[#102B50] border border-transparent hover:border-[#E8E5DE]"
                >
                  <span className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-[#F5A623]" />
                    Find Stays Near College
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#687586]" />
                </Link>
                <Link
                  href="/student/bookings"
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF8F3] transition text-xs font-bold text-[#102B50] border border-transparent hover:border-[#E8E5DE]"
                >
                  <span className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-[#21865B]" />
                    Rent Receipts & Passes
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#687586]" />
                </Link>
                <Link
                  href="/mess"
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF8F3] transition text-xs font-bold text-[#102B50] border border-transparent hover:border-[#E8E5DE]"
                >
                  <span className="flex items-center gap-2.5">
                    <Utensils className="w-4 h-4 text-[#E06D3B]" />
                    Explore Mess & Tiffin
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#687586]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
