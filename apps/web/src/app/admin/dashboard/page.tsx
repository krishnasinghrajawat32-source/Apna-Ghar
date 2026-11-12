'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Utensils,
  Image as ImageIcon,
  Users,
  MapPin,
  ExternalLink,
  Award,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import {
  UserRole,
  Property,
  Mess,
  ApprovalStatus,
  MediaItem,
  MediaReviewStatus,
} from '@apna-ghar/shared-types';

interface AdminOverview {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  pendingReviews: number;
}

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  isVerified: boolean;
  createdAt: string;
}

type AdminTab = 'properties' | 'messes' | 'media' | 'users';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('properties');

  // Filters
  const [propFilter, setPropFilter] = useState<string>('ALL');
  const [messFilter, setMessFilter] = useState<string>('ALL');
  const [mediaFilter, setMediaFilter] = useState<string>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Note Modal State
  const [reviewModal, setReviewModal] = useState<{
    type: 'property' | 'mess' | 'media' | 'user';
    id: string;
    action: 'APPROVE' | 'REJECT' | 'PHYSICAL_VERIFY' | 'SUSPEND' | 'ACTIVATE';
    name?: string;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [physicalVerifyCheck, setPhysicalVerifyCheck] = useState(false);

  // 1. Overview Metrics
  const { data: overview, isLoading: isOverviewLoading } = useQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient<AdminOverview>('/admin/overview'),
    enabled: !!user,
  });

  // 2. Properties
  const { data: properties = [], isLoading: isPropsLoading } = useQuery<Property[]>({
    queryKey: ['admin-properties'],
    queryFn: () => apiClient<Property[]>('/admin/properties'),
    enabled: !!user && activeTab === 'properties',
  });

  // 3. Mess Outlets
  const { data: messes = [], isLoading: isMessesLoading } = useQuery<Mess[]>({
    queryKey: ['admin-messes'],
    queryFn: () => apiClient<Mess[]>('/admin/messes'),
    enabled: !!user && activeTab === 'messes',
  });

  // 4. Media Items
  const { data: mediaItems = [], isLoading: isMediaLoading } = useQuery<MediaItem[]>({
    queryKey: ['admin-media'],
    queryFn: () => apiClient<MediaItem[]>('/admin/media'),
    enabled: !!user && activeTab === 'media',
  });

  // 5. Users
  const { data: users = [], isLoading: isUsersLoading } = useQuery<AdminUserItem[]>({
    queryKey: ['admin-users'],
    queryFn: () => apiClient<AdminUserItem[]>('/admin/users'),
    enabled: !!user && activeTab === 'users',
  });

  // Mutation: Moderate Property
  const moderatePropertyMutation = useMutation({
    mutationFn: ({
      propertyId,
      approvalStatus,
      isPhysicallyVerified,
      notes,
    }: {
      propertyId: string;
      approvalStatus: ApprovalStatus;
      isPhysicallyVerified?: boolean;
      notes?: string;
    }) =>
      apiClient(`/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus, isPhysicallyVerified, notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      setPhysicalVerifyCheck(false);
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  // Mutation: Moderate Mess
  const moderateMessMutation = useMutation({
    mutationFn: ({
      messId,
      approvalStatus,
      isPhysicallyVerified,
      notes,
    }: {
      messId: string;
      approvalStatus: ApprovalStatus;
      isPhysicallyVerified?: boolean;
      notes?: string;
    }) =>
      apiClient(`/admin/messes/${messId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus, isPhysicallyVerified, notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      setPhysicalVerifyCheck(false);
      queryClient.invalidateQueries({ queryKey: ['admin-messes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  // Mutation: Review Media
  const reviewMediaMutation = useMutation({
    mutationFn: ({
      mediaId,
      reviewStatus,
      notes,
    }: {
      mediaId: string;
      reviewStatus: MediaReviewStatus;
      notes?: string;
    }) =>
      apiClient(`/media/${mediaId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ reviewStatus, reviewNotes: notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
    },
  });

  // Mutation: Physical Verify Media
  const physicalVerifyMediaMutation = useMutation({
    mutationFn: ({
      mediaId,
      isPhysicallyVerified,
      notes,
    }: {
      mediaId: string;
      isPhysicallyVerified: boolean;
      notes?: string;
    }) =>
      apiClient(`/media/${mediaId}/physical-verify`, {
        method: 'PATCH',
        body: JSON.stringify({ isPhysicallyVerified, inspectorNotes: notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
    },
  });

  // Mutation: Moderate User
  const moderateUserMutation = useMutation({
    mutationFn: ({
      userId,
      status,
      notes,
    }: {
      userId: string;
      status: 'ACTIVE' | 'SUSPENDED';
      notes?: string;
    }) =>
      apiClient(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  const handleExecuteModalAction = () => {
    if (!reviewModal) return;

    if (reviewModal.type === 'property') {
      const status =
        reviewModal.action === 'APPROVE'
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.REJECTED;
      moderatePropertyMutation.mutate({
        propertyId: reviewModal.id,
        approvalStatus: status,
        isPhysicallyVerified: physicalVerifyCheck,
        notes: reviewNotes,
      });
    } else if (reviewModal.type === 'mess') {
      const status =
        reviewModal.action === 'APPROVE'
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.REJECTED;
      moderateMessMutation.mutate({
        messId: reviewModal.id,
        approvalStatus: status,
        isPhysicallyVerified: physicalVerifyCheck,
        notes: reviewNotes,
      });
    } else if (reviewModal.type === 'media') {
      if (reviewModal.action === 'PHYSICAL_VERIFY') {
        physicalVerifyMediaMutation.mutate({
          mediaId: reviewModal.id,
          isPhysicallyVerified: true,
          notes: reviewNotes,
        });
      } else {
        const status =
          reviewModal.action === 'APPROVE'
            ? MediaReviewStatus.APPROVED
            : MediaReviewStatus.REJECTED;
        reviewMediaMutation.mutate({
          mediaId: reviewModal.id,
          reviewStatus: status,
          notes: reviewNotes,
        });
      }
    } else if (reviewModal.type === 'user') {
      const status = reviewModal.action === 'ACTIVATE' ? 'ACTIVE' : 'SUSPENDED';
      moderateUserMutation.mutate({
        userId: reviewModal.id,
        status,
        notes: reviewNotes,
      });
    }
  };

  // Filtered views
  const filteredProperties = properties.filter((p) => {
    if (propFilter === 'ALL') return true;
    return (p.approvalStatus || 'PENDING') === propFilter;
  });

  const filteredMesses = messes.filter((m) => {
    if (messFilter === 'ALL') return true;
    return (m.approvalStatus || 'PENDING') === messFilter;
  });

  const filteredMedia = mediaItems.filter((item) => {
    if (mediaFilter === 'ALL') return true;
    return (item.reviewStatus || 'PENDING') === mediaFilter;
  });

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter === 'ALL') return true;
    return u.role === userRoleFilter;
  });

  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-[#FAF8F3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center text-2xl font-black shadow-md">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                    Admin Command Center
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#102B50]/10 text-[#102B50]">
                    Platform Moderator
                  </span>
                </div>
                <p className="text-xs text-[#687586] mt-1">
                  Manage listing approvals, vendor certifications, media moderation, and physical verification audit trails.
                </p>
              </div>
            </div>

            <div className="text-xs text-[#687586] bg-[#FAF8F3] px-4 py-2.5 rounded-2xl border border-[#E8E5DE] space-y-0.5">
              <span className="font-bold text-[#102B50] block">Marketplace Policy:</span>
              <span>Only approved listings appear in student search results. Unreviewed listings stay hidden.</span>
            </div>
          </div>

          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Registered Users</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : overview?.totalUsers ?? 0}
              </p>
              <span className="text-[10px] text-[#687586]">Students, Owners & Vendors</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Active Properties</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : overview?.totalProperties ?? 0}
              </p>
              <span className="text-[10px] text-[#687586]">Approved student stays</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Total Bookings</span>
              <p className="text-2xl font-black text-[#21865B] mt-1">
                {isOverviewLoading ? '—' : overview?.totalBookings ?? 0}
              </p>
              <span className="text-[10px] text-[#687586]">Tracked request lifecycle</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Pending Moderations</span>
              <p className="text-2xl font-black text-[#F5A623] mt-1">
                {isOverviewLoading ? '—' : overview?.pendingReviews ?? 0}
              </p>
              <span className="text-[10px] text-[#687586]">Listings awaiting review</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8E5DE] overflow-x-auto pb-1">
            {[
              { id: 'properties', label: 'Property Approvals', icon: Building, count: properties.length },
              { id: 'messes', label: 'Mess & Food Services', icon: Utensils, count: messes.length },
              { id: 'media', label: 'Media & Documents', icon: ImageIcon, count: mediaItems.length },
              { id: 'users', label: 'User Accounts', icon: Users, count: users.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[#102B50] text-white shadow-sm'
                      : 'text-[#687586] hover:text-[#102B50] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FAF8F3] text-[#102B50] font-black border border-[#E8E5DE]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#F5A623]" />
                    <span>Property Listings Verification</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Review newly submitted hostels and PGs. Approval publishes them to the student marketplace.
                  </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F3] p-1 rounded-xl border border-[#E8E5DE] text-xs">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPropFilter(filter)}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        propFilter === filter
                          ? 'bg-[#102B50] text-white shadow-xs'
                          : 'text-[#687586] hover:text-[#102B50]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {isPropsLoading ? (
                <div className="py-12 text-center text-xs text-[#687586]">Loading properties...</div>
              ) : filteredProperties.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No properties found for filter &quot;{propFilter}&quot;.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProperties.map((prop) => {
                    const status = (prop.approvalStatus || 'PENDING') as ApprovalStatus;
                    const isApproved = status === ApprovalStatus.APPROVED;
                    const isPending = status === ApprovalStatus.PENDING;
                    const isRejected = status === ApprovalStatus.REJECTED;

                    return (
                      <div
                        key={prop.id}
                        className="p-5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-sm text-[#102B50]">{prop.name}</h3>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#E8E5DE] text-[#263445]">
                              {prop.propertyType} • {prop.genderPreference}
                            </span>

                            {/* Approval Badge */}
                            {isApproved && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                                Admin Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#F5A623]/20 text-[#102B50] border border-[#F5A623]/30">
                                Pending Approval
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20">
                                Rejected
                              </span>
                            )}

                            {/* Physical Verification Badge */}
                            {prop.isPhysicallyVerified ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#102B50] text-white flex items-center gap-1">
                                <Award className="w-3 h-3 text-[#F5A623]" />
                                Physically Verified
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#687586] px-2 py-0.5 rounded bg-white border border-[#E8E5DE]">
                                Unverified On-Site
                              </span>
                            )}
                          </div>

                          <div className="text-[#687586] flex flex-wrap items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                              <span>
                                {prop.address.street}, {prop.address.city}
                              </span>
                            </span>
                            {prop.location?.coordinates && (
                              <span>
                                Coordinates: [{prop.location.coordinates[1].toFixed(4)},{' '}
                                {prop.location.coordinates[0].toFixed(4)}]
                              </span>
                            )}
                            <span>Owner ID: {prop.ownerId}</span>
                          </div>

                          {prop.approvalNotes && (
                            <p className="text-[11px] text-[#687586] bg-white p-2 rounded-xl border border-[#E8E5DE]">
                              <span className="font-bold text-[#102B50]">Admin Audit Note:</span>{' '}
                              {prop.approvalNotes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    type: 'property',
                                    id: prop.id,
                                    action: 'APPROVE',
                                    name: prop.name,
                                  })
                                }
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B] transition shadow-xs"
                              >
                                Approve Listing
                              </button>
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    type: 'property',
                                    id: prop.id,
                                    action: 'REJECT',
                                    name: prop.name,
                                  })
                                }
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && !prop.isPhysicallyVerified && (
                            <button
                              onClick={() => {
                                setPhysicalVerifyCheck(true);
                                setReviewModal({
                                  type: 'property',
                                  id: prop.id,
                                  action: 'APPROVE',
                                  name: `${prop.name} (Record Physical Inspection)`,
                                });
                              }}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] border border-[#102B50]/30 hover:bg-[#102B50] hover:text-white transition flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5 text-[#F5A623]" />
                              <span>Record Physical Verification</span>
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() =>
                                setReviewModal({
                                  type: 'property',
                                  id: prop.id,
                                  action: 'REJECT',
                                  name: prop.name,
                                })
                              }
                              className="px-3 py-2 rounded-xl text-xs font-bold text-[#D64545] hover:bg-[#D64545]/10 transition"
                            >
                              Suspend / Revoke
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

          {/* TAB 2: MESS OUTLETS */}
          {activeTab === 'messes' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#F5A623]" />
                    <span>Food Vendor & Mess Outlets</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Review and verify mess partner kitchens, FSSAI certificates, and delivery radiuses.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FAF8F3] p-1 rounded-xl border border-[#E8E5DE] text-xs">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setMessFilter(filter)}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        messFilter === filter
                          ? 'bg-[#102B50] text-white shadow-xs'
                          : 'text-[#687586] hover:text-[#102B50]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {isMessesLoading ? (
                <div className="py-12 text-center text-xs text-[#687586]">Loading messes...</div>
              ) : filteredMesses.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No mess outlets found for filter &quot;{messFilter}&quot;.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMesses.map((mess) => {
                    const status = (mess.approvalStatus || 'PENDING') as ApprovalStatus;
                    const isApproved = status === ApprovalStatus.APPROVED;
                    const isPending = status === ApprovalStatus.PENDING;

                    return (
                      <div
                        key={mess.id}
                        className="p-5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-sm text-[#102B50]">{mess.name}</h3>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#E8E5DE] text-[#263445]">
                              {mess.dietaryType}
                            </span>

                            {isApproved && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                                Approved Outlet
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#F5A623]/20 text-[#102B50] border border-[#F5A623]/30">
                                Pending Approval
                              </span>
                            )}

                            {mess.isPhysicallyVerified ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#102B50] text-white flex items-center gap-1">
                                <Award className="w-3 h-3 text-[#F5A623]" />
                                Kitchen Inspected
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#687586] px-2 py-0.5 rounded bg-white border border-[#E8E5DE]">
                                Uninspected Kitchen
                              </span>
                            )}
                          </div>

                          <div className="text-[#687586] flex flex-wrap items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                              <span>
                                {mess.address?.street}, {mess.address?.city}
                              </span>
                            </span>
                            <span>FSSAI: {mess.fssaiNumber || 'Pending'}</span>
                            <span>Delivery Radius: {mess.deliveryRadiusKm || 3} km</span>
                            <span>Partner ID: {mess.partnerId}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    type: 'mess',
                                    id: mess.id,
                                    action: 'APPROVE',
                                    name: mess.name,
                                  })
                                }
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B] transition shadow-xs"
                              >
                                Approve Outlet
                              </button>
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    type: 'mess',
                                    id: mess.id,
                                    action: 'REJECT',
                                    name: mess.name,
                                  })
                                }
                                className="px-3 py-2 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() =>
                                setReviewModal({
                                  type: 'mess',
                                  id: mess.id,
                                  action: 'REJECT',
                                  name: mess.name,
                                })
                              }
                              className="px-3 py-2 rounded-xl text-xs font-bold text-[#D64545] hover:bg-[#D64545]/10 transition"
                            >
                              Suspend Outlet
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

          {/* TAB 3: MEDIA & DOCUMENTS */}
          {activeTab === 'media' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#F5A623]" />
                    <span>Media & Document Moderation</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Review uploaded photos, room tours, kitchen snapshots, and proof documents. Digital approval is distinct from on-site physical verification.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FAF8F3] p-1 rounded-xl border border-[#E8E5DE] text-xs">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setMediaFilter(filter)}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        mediaFilter === filter
                          ? 'bg-[#102B50] text-white shadow-xs'
                          : 'text-[#687586] hover:text-[#102B50]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {isMediaLoading ? (
                <div className="py-12 text-center text-xs text-[#687586]">Loading media records...</div>
              ) : filteredMedia.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No media items found for filter &quot;{mediaFilter}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedia.map((item) => {
                    const isApproved = item.reviewStatus === MediaReviewStatus.APPROVED;
                    const isPending = item.reviewStatus === MediaReviewStatus.PENDING;
                    const isRejected = item.reviewStatus === MediaReviewStatus.REJECTED;

                    return (
                      <div
                        key={item.id}
                        className="bg-[#FAF8F3] border border-[#E8E5DE] rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          {/* Image preview */}
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5 border border-[#E8E5DE]">
                            <Image
                              src={item.url}
                              alt={item.originalFilename || 'Media item'}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                {item.area || item.category || 'MEDIA'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-bold text-[#102B50] truncate block">
                              {item.originalFilename}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isApproved && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B]">
                                  Admin Approved
                                </span>
                              )}
                              {isPending && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#F5A623]/20 text-[#102B50]">
                                  Pending Review
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D64545]/10 text-[#D64545]">
                                  Rejected
                                </span>
                              )}

                              {item.isPhysicallyVerified && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#102B50] text-white">
                                  Physically Verified
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-[#687586]">
                              Uploaded for: {item.relatedEntityType} ({item.relatedEntityId})
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-[#E8E5DE] flex items-center justify-between gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#102B50] hover:text-[#F5A623] p-1.5 rounded-lg border border-[#E8E5DE] bg-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="flex items-center gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    setReviewModal({
                                      type: 'media',
                                      id: item.id,
                                      action: 'APPROVE',
                                      name: item.originalFilename,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setReviewModal({
                                      type: 'media',
                                      id: item.id,
                                      action: 'REJECT',
                                      name: item.originalFilename,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isApproved && !item.isPhysicallyVerified && (
                              <button
                                onClick={() =>
                                  setReviewModal({
                                    type: 'media',
                                    id: item.id,
                                    action: 'PHYSICAL_VERIFY',
                                    name: `${item.originalFilename} (Confirm Physical Verification)`,
                                  })
                                }
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-[#102B50] bg-white border border-[#102B50]/30 hover:bg-[#102B50] hover:text-white"
                              >
                                Mark Physically Verified
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS */}
          {activeTab === 'users' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#F5A623]" />
                    <span>User Account Moderation</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Review registered students, property owners, and food vendors. Suspend compromised or fraudulent accounts.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FAF8F3] p-1 rounded-xl border border-[#E8E5DE] text-xs">
                  {['ALL', 'STUDENT', 'OWNER', 'MESS_PARTNER'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setUserRoleFilter(filter)}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        userRoleFilter === filter
                          ? 'bg-[#102B50] text-white shadow-xs'
                          : 'text-[#687586] hover:text-[#102B50]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {isUsersLoading ? (
                <div className="py-12 text-center text-xs text-[#687586]">Loading user records...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No users found for filter &quot;{userRoleFilter}&quot;.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((item) => {
                    const isSuspended = item.status === 'SUSPENDED';

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#102B50] text-sm">{item.name}</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white border border-[#E8E5DE] text-[#102B50]">
                              {item.role}
                            </span>
                            {isSuspended ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20">
                                Suspended
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B] border border-[#21865B]/20">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#687586] flex items-center gap-2">
                            <span>{item.email}</span>
                            {item.phone && (
                              <>
                                <span>•</span>
                                <span>{item.phone}</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div>
                          {isSuspended ? (
                            <button
                              onClick={() =>
                                setReviewModal({
                                  type: 'user',
                                  id: item.id,
                                  action: 'ACTIVATE',
                                  name: item.name,
                                })
                              }
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B]"
                            >
                              Reactivate Account
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setReviewModal({
                                  type: 'user',
                                  id: item.id,
                                  action: 'SUSPEND',
                                  name: item.name,
                                })
                              }
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10"
                            >
                              Suspend Account
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

          {/* Action Modal with Review Notes */}
          {reviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E5DE] space-y-4">
                <div className="flex items-center gap-2 text-[#102B50]">
                  <ShieldCheck className="w-5 h-5 text-[#F5A623]" />
                  <h3 className="font-extrabold text-base">
                    {reviewModal.action === 'APPROVE' && 'Confirm Approval'}
                    {reviewModal.action === 'REJECT' && 'Confirm Rejection'}
                    {reviewModal.action === 'PHYSICAL_VERIFY' && 'Record Physical Verification'}
                    {reviewModal.action === 'SUSPEND' && 'Suspend User Account'}
                    {reviewModal.action === 'ACTIVATE' && 'Reactivate User Account'}
                  </h3>
                </div>

                <p className="text-xs text-[#687586]">
                  Target: <span className="font-bold text-[#102B50]">{reviewModal.name}</span>
                </p>

                {reviewModal.action === 'APPROVE' && reviewModal.type === 'property' && (
                  <label className="flex items-start gap-2 p-3 bg-[#FAF8F3] border border-[#E8E5DE] rounded-xl cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={physicalVerifyCheck}
                      onChange={(e) => setPhysicalVerifyCheck(e.target.checked)}
                      className="mt-0.5 rounded border-[#E8E5DE] text-[#102B50] focus:ring-[#102B50]"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#102B50] block">Record Physical Verification</span>
                      <span className="text-[10px] text-[#687586] block">
                        Check ONLY if an authorized on-site physical inspection was actually conducted. Digital photo review alone does not qualify.
                      </span>
                    </div>
                  </label>
                )}

                <div>
                  <label className="text-xs font-bold text-[#102B50] block mb-1.5">
                    Audit Notes & Justification (Recorded for platform logs)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on verification steps taken, document numbers checked, or reason for action..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-[#E8E5DE] text-[#263445] bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setReviewModal(null);
                      setReviewNotes('');
                      setPhysicalVerifyCheck(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#687586] hover:bg-[#FAF8F3] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteModalAction}
                    disabled={
                      moderatePropertyMutation.isPending ||
                      moderateMessMutation.isPending ||
                      reviewMediaMutation.isPending ||
                      physicalVerifyMediaMutation.isPending ||
                      moderateUserMutation.isPending
                    }
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] transition disabled:opacity-50"
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
