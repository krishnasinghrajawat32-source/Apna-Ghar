'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  BedDouble,
  Calendar,
  Wrench,
  FileText,
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  ChevronRight,
  X,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  UserRole,
  OwnerOverviewMetrics,
  OwnerPropertySummary,
  Visit,
  VisitStatus,
  MaintenanceTicket,
  Booking,
  BookingStatus,
  BedStatus,
} from '@apna-ghar/shared-types';

export default function OwnerDashboardPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'visits' | 'tickets' | 'bookings'>('overview');

  // Selected property for inventory modal
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Ticket resolution modal
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 1. Fetch Owner Metrics Overview
  const { data: metrics } = useQuery<OwnerOverviewMetrics>({
    queryKey: ['owner-overview'],
    queryFn: () => apiClient<OwnerOverviewMetrics>('/owner/overview'),
    enabled: isAuthenticated,
  });

  // 2. Fetch Owner Properties
  const { data: properties = [] } = useQuery<OwnerPropertySummary[]>({
    queryKey: ['owner-properties'],
    queryFn: () => apiClient<OwnerPropertySummary[]>('/owner/properties'),
    enabled: isAuthenticated,
  });

  // 3. Fetch Owner Visits
  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: ['owner-visits'],
    queryFn: () => apiClient<Visit[]>('/visits/owner'),
    enabled: isAuthenticated,
  });

  // 4. Fetch Owner Tickets
  const { data: tickets = [] } = useQuery<MaintenanceTicket[]>({
    queryKey: ['owner-tickets'],
    queryFn: () => apiClient<MaintenanceTicket[]>('/tickets/owner'),
    enabled: isAuthenticated,
  });

  // 5. Fetch Owner Bookings
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['owner-bookings'],
    queryFn: () => apiClient<Booking[]>('/bookings/owner'),
    enabled: isAuthenticated,
  });

  // 6. Fetch Deep Inventory for selected property
  const { data: propertyInventory, isLoading: isInventoryLoading } = useQuery<any>({
    queryKey: ['owner-property-inventory', selectedPropertyId],
    queryFn: () => apiClient<any>(`/owner/properties/${selectedPropertyId}/inventory`),
    enabled: isAuthenticated && !!selectedPropertyId,
  });

  // Mutations
  const updateVisitStatusMutation = useMutation({
    mutationFn: ({ visitId, status }: { visitId: string; status: VisitStatus }) =>
      apiClient<Visit>(`/visits/${visitId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-visits'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: ({
      ticketId,
      status,
      notes,
    }: {
      ticketId: string;
      status: 'IN_PROGRESS' | 'RESOLVED';
      notes?: string;
    }) =>
      apiClient<MaintenanceTicket>(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes: notes }),
      }),
    onSuccess: () => {
      setResolvingTicketId(null);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['owner-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  const updateBedStatusMutation = useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: 'AVAILABLE' | 'MAINTENANCE' }) =>
      apiClient<any>(`/owner/beds/${bedId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ permanentStatus: status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-property-inventory', selectedPropertyId] });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  return (
    <AuthGuard allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DCE8E2] text-[#173327] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#173327] tracking-tight">
                  Owner Portal — {user?.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Partner
                </span>
              </div>
              <p className="text-xs text-[#3D3A33] mt-0.5">
                Property Portfolio & Live Occupancy Dispatch • Account: {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-[#ECE8DD] hover:bg-slate-50 transition"
            >
              <span>Explore Marketplace</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Real-time Portfolio Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Properties
            </span>
            <p className="text-2xl font-black text-[#173327]">
              {metrics?.totalProperties ?? properties.length}
            </p>
            <span className="text-[10px] text-slate-400">Total listed</span>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Occupancy
            </span>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black text-emerald-600">
                {metrics?.occupancyRate ?? 0}%
              </p>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, metrics?.occupancyRate ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Bed Capacity
            </span>
            <p className="text-2xl font-black text-slate-900">
              {metrics?.totalBeds ?? 0}
            </p>
            <span className="text-[10px] text-slate-500">
              {metrics?.availableBeds ?? 0} available • {metrics?.occupiedBeds ?? 0} booked
            </span>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Confirmed Stays
            </span>
            <p className="text-2xl font-black text-[#173327]">
              {metrics?.confirmedBookings ?? bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">Active leases</span>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Visits
            </span>
            <p className="text-2xl font-black text-amber-600">
              {metrics?.pendingVisits ?? visits.filter((v) => v.status === VisitStatus.REQUESTED).length}
            </p>
            <span className="text-[10px] text-slate-400">Needs confirmation</span>
          </div>

          <div className="bg-white border border-[#ECE8DD] rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Maintenance
            </span>
            <p className="text-2xl font-black text-rose-600">
              {metrics?.openTickets ?? tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
            </p>
            <span className="text-[10px] text-slate-400">Open tickets</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#ECE8DD] gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Properties & Inventory', icon: Layers, count: properties.length },
            { id: 'visits', label: 'Scheduled Visits', icon: Calendar, count: visits.length },
            { id: 'tickets', label: 'Maintenance Requests', icon: Wrench, count: tickets.length },
            { id: 'bookings', label: 'Confirmed Stays', icon: FileText, count: bookings.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? 'border-[#173327] text-[#173327]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#DCE8E2] text-[#173327]' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROPERTIES & INVENTORY */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {properties.length === 0 ? (
              <div className="bg-white border border-[#ECE8DD] rounded-3xl p-10 text-center space-y-3">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-[#173327]">No properties assigned to your account</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your property partner onboarding is registered. Contact support or administration to attach active campus accommodation buildings to your profile.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#173327]/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-slate-900">{property.name}</h3>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                            {property.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {property.city} • Type: {property.propertyType}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedPropertyId(property.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                      >
                        <span>Inventory</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 rounded-xl bg-[#FCFBF7] border border-[#ECE8DD]">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Rooms</span>
                        <span className="font-bold text-slate-900">{property.totalRooms}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Beds</span>
                        <span className="font-bold text-slate-900">{property.totalBeds}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block">Available</span>
                        <span className="font-bold text-emerald-600">{property.availableBeds}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Booked</span>
                        <span className="font-bold text-slate-900">{property.occupiedBeds}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULED VISITS */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="bg-white border border-[#ECE8DD] rounded-3xl p-10 text-center space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-[#173327]">No property visits scheduled</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When prospective students request in-person visits to tour your rooms, they will appear here with contact details.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((visit) => {
                  const isRequested = visit.status === VisitStatus.REQUESTED;
                  const isConfirmed = visit.status === VisitStatus.CONFIRMED;

                  return (
                    <div
                      key={visit.id}
                      className="bg-white border border-[#ECE8DD] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {visit.student?.name || 'Prospective Student'}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isRequested
                                ? 'bg-amber-100 text-amber-800'
                                : isConfirmed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {visit.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{visit.property?.name || 'Property'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(visit.scheduledAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              ({visit.slot || 'Confirmed Slot'})
                            </span>
                          </span>
                          {visit.student?.phone && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{visit.student.phone}</span>
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isRequested && (
                          <>
                            <button
                              onClick={() =>
                                updateVisitStatusMutation.mutate({
                                  visitId: visit.id,
                                  status: VisitStatus.CONFIRMED,
                                })
                              }
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition"
                            >
                              Confirm Visit
                            </button>
                            <button
                              onClick={() =>
                                updateVisitStatusMutation.mutate({
                                  visitId: visit.id,
                                  status: VisitStatus.CANCELLED,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {isConfirmed && (
                          <button
                            onClick={() =>
                              updateVisitStatusMutation.mutate({
                                visitId: visit.id,
                                status: VisitStatus.COMPLETED,
                              })
                            }
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MAINTENANCE REQUESTS DISPATCH */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white border border-[#ECE8DD] rounded-3xl p-10 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-sm text-[#173327]">All rooms & fixtures running smoothly</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Zero active maintenance requests filed by students across your properties.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const isOpen = ticket.status === 'OPEN';
                  const isInProgress = ticket.status === 'IN_PROGRESS';
                  const isResolved = ticket.status === 'RESOLVED';

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{ticket.title}</span>
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
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                              Priority: {ticket.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Category: <span className="font-semibold text-slate-700">{ticket.category}</span> • Reported:{' '}
                            {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOpen && (
                            <button
                              onClick={() =>
                                updateTicketStatusMutation.mutate({
                                  ticketId: ticket.id,
                                  status: 'IN_PROGRESS',
                                })
                              }
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition"
                            >
                              Dispatch Warden (In Progress)
                            </button>
                          )}

                          {(isOpen || isInProgress) && (
                            <button
                              onClick={() => setResolvingTicketId(ticket.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-[#FCFBF7] p-3 rounded-xl border border-[#ECE8DD]">
                        {ticket.description}
                      </p>

                      {ticket.resolutionNotes && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl">
                          <span className="font-bold">Resolution Notes:</span> {ticket.resolutionNotes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONFIRMED BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white border border-[#ECE8DD] rounded-3xl p-10 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-[#173327]">No bookings placed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Confirmed bed bookings from students will appear here with move-in dates and collected advance rents.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          {booking.bookingReference}
                        </span>
                        <span className="font-bold text-xs text-slate-900">
                          {booking.student?.name || 'Resident Student'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {booking.property?.name || 'Property'} • Room {booking.room?.roomNumber || '—'} (
                        {booking.bed?.bedLabel || 'Bed'}) • Move-in:{' '}
                        {new Date(booking.moveInDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-[#173327] block">
                        {formatCurrency(booking.totalInitialPayment)}
                      </span>
                      <span className="text-[10px] text-slate-400">Rent + Deposit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROPERTY INVENTORY MODAL */}
        {selectedPropertyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE8DD]">
                <div>
                  <h3 className="font-black text-base text-[#173327]">
                    {propertyInventory?.property?.name || 'Property Inventory'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Room hierarchy & physical bed maintenance control
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPropertyId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isInventoryLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading room & bed breakdown...
                </div>
              ) : (
                <div className="overflow-y-auto space-y-4 pr-1">
                  {propertyInventory?.rooms?.map((room: any) => (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl border border-[#ECE8DD] bg-[#FCFBF7] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-emerald-700" />
                          <span className="font-black text-xs text-slate-900">
                            Room {room.roomNumber} (Floor {room.floorNumber})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {room.roomType?.name || 'Standard'} • {formatCurrency(room.roomType?.baseRent || 0)}/mo
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {room.beds?.map((bed: any) => {
                          const isBooked = bed.permanentStatus === BedStatus.BOOKED;
                          const isAvailable = bed.permanentStatus === BedStatus.AVAILABLE;

                          return (
                            <div
                              key={bed.id}
                              className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800 block">{bed.bedLabel}</span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                    isBooked
                                      ? 'bg-slate-900 text-white'
                                      : isAvailable
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {bed.permanentStatus}
                                </span>
                              </div>

                              {!isBooked && (
                                <button
                                  onClick={() =>
                                    updateBedStatusMutation.mutate({
                                      bedId: bed.id,
                                      status: isAvailable ? 'MAINTENANCE' : 'AVAILABLE',
                                    })
                                  }
                                  disabled={updateBedStatusMutation.isPending}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                    isAvailable
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                >
                                  {isAvailable ? 'Mark Repair' : 'Mark Available'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESOLVE TICKET MODAL */}
        {resolvingTicketId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-[#173327]">Resolve Maintenance Ticket</h3>
                <button
                  onClick={() => setResolvingTicketId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Plumber repaired the valve; tested water pressure."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setResolvingTicketId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateTicketStatusMutation.mutate({
                      ticketId: resolvingTicketId,
                      status: 'RESOLVED',
                      notes: resolutionNotes,
                    })
                  }
                  disabled={updateTicketStatusMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition"
                >
                  {updateTicketStatusMutation.isPending ? 'Updating...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
