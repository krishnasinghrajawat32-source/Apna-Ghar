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
  Radio,
  FileText,
  Search,
  Check,
  X,
  AlertTriangle,
  Lock,
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
  AdminDashboardStats,
  AdminAuditLog,
  RoleApprovalStatus,
} from '@apna-ghar/shared-types';

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emailVerified: boolean;
  roleApprovalStatus?: RoleApprovalStatus;
  presenceStatus?: 'ACTIVE' | 'INACTIVE';
  activeSessionCount?: number;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

type AdminTab = 'properties' | 'messes' | 'media' | 'users' | 'audit_logs';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Filters
  const [propFilter, setPropFilter] = useState<string>('ALL');
  const [messFilter, setMessFilter] = useState<string>('ALL');
  const [mediaFilter, setMediaFilter] = useState<string>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [roleApprovalFilter, setRoleApprovalFilter] = useState<string>('ALL');

  // Note Modal State
  const [reviewModal, setReviewModal] = useState<{
    type: 'property' | 'mess' | 'media' | 'user' | 'role_approval';
    id: string;
    action:
      | 'APPROVE'
      | 'REJECT'
      | 'PHYSICAL_VERIFY'
      | 'SUSPEND'
      | 'ACTIVATE'
      | 'ROLE_APPROVE'
      | 'ROLE_REJECT';
    name?: string;
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [physicalVerifyCheck, setPhysicalVerifyCheck] = useState(false);

  // 1. Live Real-Time Dashboard Statistics (15s polling)
  const { data: statsData, isLoading: isStatsLoading } = useQuery<{ success: boolean; data: AdminDashboardStats }>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => apiClient<{ success: boolean; data: AdminDashboardStats }>('/admin/dashboard-stats'),
    refetchInterval: 15000,
    enabled: !!user,
  });

  const stats = statsData?.data;

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

  // 5. Users List
  const { data: usersData, isLoading: isUsersLoading } = useQuery<{
    success: boolean;
    data: AdminUserItem[];
  }>({
    queryKey: ['admin-users', userRoleFilter, userSearchTerm, roleApprovalFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userRoleFilter !== 'ALL') params.set('role', userRoleFilter);
      if (userSearchTerm) params.set('search', userSearchTerm);
      if (roleApprovalFilter !== 'ALL') params.set('roleApprovalStatus', roleApprovalFilter);
      return apiClient<{ success: boolean; data: AdminUserItem[] }>(`/admin/users?${params.toString()}`);
    },
    enabled: !!user && activeTab === 'users',
    refetchInterval: 15000,
  });

  const users = usersData?.data || [];

  // 6. Admin Audit Logs
  const { data: auditLogsData, isLoading: isAuditLogsLoading } = useQuery<{
    success: boolean;
    data: AdminAuditLog[];
  }>({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiClient<{ success: boolean; data: AdminAuditLog[] }>('/admin/audit-logs'),
    enabled: !!user && activeTab === 'audit_logs',
  });

  const auditLogs = auditLogsData?.data || [];

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
        body: JSON.stringify({ status: approvalStatus, isPhysicallyVerified, reason: notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      setPhysicalVerifyCheck(false);
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
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
        body: JSON.stringify({ status: approvalStatus, isPhysicallyVerified, reason: notes }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      setPhysicalVerifyCheck(false);
      queryClient.invalidateQueries({ queryKey: ['admin-messes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
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

  // Mutation: Moderate User Status (Suspension revokes sessions)
  const moderateUserMutation = useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: 'ACTIVE' | 'SUSPENDED';
      reason?: string;
    }) =>
      apiClient(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  // Mutation: Moderate Role Approval for Owner or Mess Partner
  const moderateRoleApprovalMutation = useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: RoleApprovalStatus;
      reason?: string;
    }) =>
      apiClient(`/admin/users/${userId}/role-approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => {
      setReviewModal(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
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
        reason: reviewNotes,
      });
    } else if (reviewModal.type === 'role_approval') {
      const status =
        reviewModal.action === 'ROLE_APPROVE'
          ? RoleApprovalStatus.APPROVED
          : RoleApprovalStatus.REJECTED;
      moderateRoleApprovalMutation.mutate({
        userId: reviewModal.id,
        status,
        reason: reviewNotes,
      });
    }
  };

  // Filtered views for properties, messes, media
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

  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-[#FAF8F3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#173327] text-[#FCFBF7] flex items-center justify-center text-2xl font-black shadow-md">
                <ShieldAlert className="w-8 h-8 text-[#E06D3B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#173327] tracking-tight">
                    Admin Command Center
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#173327]/10 text-[#173327]">
                    Foundation & Moderation
                  </span>
                </div>
                <p className="text-xs text-[#3D3A33] mt-1">
                  Manage user authentication states, role approvals, listing moderation, session tracking, and append-only audit trails.
                </p>
              </div>
            </div>

            <div className="text-xs text-[#3D3A33] bg-[#FAF8F3] px-4 py-2.5 rounded-2xl border border-[#E8E5DE] space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-[#173327]">Real-Time Telemetry Active</span>
              </div>
              <span className="text-[11px] text-[#716D64] block">Presence derived from unrevoked sessions active &le; 15m</span>
            </div>
          </div>

          {/* Real Live Database Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Users & Role Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#687586]">Total Accounts</span>
                <Users className="w-4 h-4 text-[#173327]" />
              </div>
              <p className="text-2xl font-black text-[#173327]">
                {isStatsLoading ? '—' : stats?.totalUsers ?? 0}
              </p>
              <div className="pt-1 text-[11px] text-[#716D64] flex flex-wrap gap-x-2 gap-y-0.5">
                <span>{stats?.roles?.students ?? 0} Students</span>
                <span>•</span>
                <span>{stats?.roles?.owners ?? 0} Owners</span>
                <span>•</span>
                <span>{stats?.roles?.messPartners ?? 0} Mess</span>
              </div>
            </div>

            {/* Metric 2: Live Presence */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#687586]">Active Presence</span>
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-emerald-700">
                  {isStatsLoading ? '—' : stats?.presence?.online ?? 0}
                </p>
                <span className="text-xs font-bold text-emerald-600">Online Now</span>
              </div>
              <div className="pt-1 text-[11px] text-[#716D64]">
                <span>{stats?.presence?.offline ?? 0} currently offline</span>
              </div>
            </div>

            {/* Metric 3: Email Verification */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#687586]">Email Verification</span>
                <ShieldCheck className="w-4 h-4 text-[#E06D3B]" />
              </div>
              <p className="text-2xl font-black text-[#173327]">
                {isStatsLoading ? '—' : stats?.emailVerification?.verified ?? 0}
              </p>
              <div className="pt-1 text-[11px] text-[#716D64]">
                <span className="text-amber-700 font-semibold">{stats?.emailVerification?.unverified ?? 0} unverified</span>
                <span> • {stats?.accountStatus?.suspended ?? 0} suspended</span>
              </div>
            </div>

            {/* Metric 4: Partner Role Approvals */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#687586]">Partner Approvals</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-amber-600">
                  {isStatsLoading ? '—' : stats?.roleApprovals?.pending ?? 0}
                </p>
                <span className="text-xs font-bold text-amber-700">Pending Review</span>
              </div>
              <div className="pt-1 text-[11px] text-[#716D64]">
                <span>{stats?.roleApprovals?.approved ?? 0} approved</span>
                <span> • </span>
                <span>{stats?.roleApprovals?.rejected ?? 0} rejected</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8E5DE] pb-2 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-[#173327] text-white shadow-sm'
                  : 'bg-white text-[#687586] hover:text-[#173327] border border-[#E8E5DE]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Accounts & Approvals</span>
            </button>

            <button
              onClick={() => setActiveTab('properties')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'properties'
                  ? 'bg-[#173327] text-white shadow-sm'
                  : 'bg-white text-[#687586] hover:text-[#173327] border border-[#E8E5DE]'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Property Listings ({properties.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('messes')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'messes'
                  ? 'bg-[#173327] text-white shadow-sm'
                  : 'bg-white text-[#687586] hover:text-[#173327] border border-[#E8E5DE]'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Food Vendors ({messes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'media'
                  ? 'bg-[#173327] text-white shadow-sm'
                  : 'bg-white text-[#687586] hover:text-[#173327] border border-[#E8E5DE]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Media Items ({mediaItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'audit_logs'
                  ? 'bg-[#173327] text-white shadow-sm'
                  : 'bg-white text-[#687586] hover:text-[#173327] border border-[#E8E5DE]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* TAB: USERS & ROLE APPROVALS */}
          {activeTab === 'users' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#173327] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#E06D3B]" />
                    <span>User Directory & Role Approvals</span>
                  </h2>
                  <p className="text-xs text-[#716D64] mt-0.5">
                    Review identity status, approve Owner/Vendor accounts, inspect live sessions, and suspend accounts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#716D64] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E8E5DE] bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#173327]"
                    />
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-1 bg-[#FAF8F3] p-1 rounded-xl border border-[#E8E5DE] text-xs">
                    {['ALL', 'STUDENT', 'OWNER', 'MESS_PARTNER'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setUserRoleFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                          userRoleFilter === filter
                            ? 'bg-[#173327] text-white shadow-xs'
                            : 'text-[#687586] hover:text-[#173327]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Role approval filter */}
                  <div className="flex items-center gap-1 bg-[#FAF8F3] p-1 rounded-xl border border-[#E8E5DE] text-xs">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setRoleApprovalFilter(filter)}
                        className={`px-2 py-1 rounded-lg font-bold transition text-[10px] ${
                          roleApprovalFilter === filter
                            ? 'bg-[#E06D3B] text-white shadow-xs'
                            : 'text-[#687586] hover:text-[#173327]'
                        }`}
                      >
                        {filter === 'ALL' ? 'All Approvals' : filter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isUsersLoading ? (
                <div className="py-12 text-center text-xs text-[#687586]">Loading verified user records...</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No users matched the criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((item) => {
                    const isSuspended = item.status === 'SUSPENDED' || item.accountStatus === 'SUSPENDED';
                    const isOnline = item.presenceStatus === 'ACTIVE';
                    const isOwnerOrVendor = item.role === UserRole.OWNER || item.role === UserRole.MESS_PARTNER;
                    const approvalStatus = item.roleApprovalStatus || RoleApprovalStatus.PENDING;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition hover:border-[#173327]/30"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#173327] text-sm">{item.name}</span>

                            {/* Presence Badge */}
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Offline
                              </span>
                            )}

                            {/* Role Badge */}
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#E8E5DE] text-[#173327]">
                              {item.role}
                            </span>

                            {/* Email Verification Badge */}
                            {item.emailVerified ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Email Verified
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                ⏳ Email Unverified
                              </span>
                            )}

                            {/* Partner Role Approval Status */}
                            {isOwnerOrVendor && (
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  approvalStatus === RoleApprovalStatus.APPROVED
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : approvalStatus === RoleApprovalStatus.REJECTED
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                }`}
                              >
                                Role: {approvalStatus}
                              </span>
                            )}

                            {/* Account Status Badge */}
                            {isSuspended && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                Account Suspended
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#716D64] flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{item.email}</span>
                            {item.phone && (
                              <>
                                <span>•</span>
                                <span>{item.phone}</span>
                              </>
                            )}
                            {item.activeSessionCount !== undefined && (
                              <>
                                <span>•</span>
                                <span>{item.activeSessionCount} active session(s)</span>
                              </>
                            )}
                            {item.lastActivityAt && (
                              <>
                                <span>•</span>
                                <span>Last active: {new Date(item.lastActivityAt).toLocaleTimeString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Role Approval Actions (for Owner/Vendor) */}
                          {isOwnerOrVendor && approvalStatus !== RoleApprovalStatus.APPROVED && (
                            <button
                              onClick={() =>
                                setReviewModal({
                                  type: 'role_approval',
                                  id: item.id,
                                  action: 'ROLE_APPROVE',
                                  name: `${item.name} (${item.role})`,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve Role
                            </button>
                          )}

                          {isOwnerOrVendor && approvalStatus !== RoleApprovalStatus.REJECTED && (
                            <button
                              onClick={() =>
                                setReviewModal({
                                  type: 'role_approval',
                                  id: item.id,
                                  action: 'ROLE_REJECT',
                                  name: `${item.name} (${item.role})`,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 transition flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject Role
                            </button>
                          )}

                          {/* Account Suspension Actions */}
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
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition"
                            >
                              Reactivate
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
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 transition flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              Suspend
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

          {/* TAB: AUDIT TRAIL */}
          {activeTab === 'audit_logs' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#173327] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#E06D3B]" />
                    <span>Platform Administrator Audit Trail</span>
                  </h2>
                  <p className="text-xs text-[#716D64] mt-0.5">
                    Immutable, append-only security logs for user approvals, suspensions, listing decisions, and inspections.
                  </p>
                </div>
              </div>

              {isAuditLogsLoading ? (
                <div className="py-12 text-center text-xs text-[#716D64]">Loading audit trail...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#716D64] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No audit events logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-[#E8E5DE] bg-[#FAF8F3] space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-[#173327] text-white">
                            {log.action}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#E8E5DE] text-[#3D3A33]">
                            Target: {log.targetType} ({log.targetId})
                          </span>
                        </div>
                        <span className="text-[11px] text-[#716D64]">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#3D3A33] flex flex-wrap gap-x-4">
                        <span><strong>Admin:</strong> {log.adminEmail || 'Admin User'}</span>
                        {log.reason && <span><strong>Notes:</strong> {log.reason}</span>}
                        {log.ipAddress && <span><strong>IP:</strong> {log.ipAddress}</span>}
                      </div>

                      {log.diff && (
                        <pre className="p-2.5 rounded-lg bg-white border border-[#E8E5DE] text-[10px] text-[#3D3A33] overflow-x-auto font-mono">
                          {JSON.stringify(log.diff, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#F5A623]" />
                    <span>Property Listings Moderation</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Review submitted student properties. Approving sets status to ACTIVE and exposes listing to student search.
                  </p>
                </div>

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
                <div className="py-12 text-center text-xs text-[#687586]">Loading property listings...</div>
              ) : filteredProperties.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No properties found for filter &quot;{propFilter}&quot;.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProperties.map((prop) => {
                    const isPending = (prop.approvalStatus || 'PENDING') === 'PENDING';
                    const isApproved = prop.approvalStatus === 'APPROVED';

                    return (
                      <div
                        key={prop.id}
                        className="p-5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#102B50] text-sm">{prop.name}</span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isApproved
                                  ? 'bg-[#21865B]/10 text-[#21865B] border-[#21865B]/20'
                                  : prop.approvalStatus === 'REJECTED'
                                  ? 'bg-[#D64545]/10 text-[#D64545] border-[#D64545]/20'
                                  : 'bg-[#F5A623]/10 text-[#D98200] border-[#F5A623]/20'
                              }`}
                            >
                              {prop.approvalStatus || 'PENDING'}
                            </span>
                            {prop.isPhysicallyVerified && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#102B50] text-white flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Physically Verified
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#687586] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {prop.address.street}, {prop.address.city}, {prop.address.state} - {prop.address.pincode}
                            </span>
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-[#263445] pt-1">
                            <span>Type: <strong>{prop.propertyType}</strong></span>
                            <span>•</span>
                            <span>Gender: <strong>{prop.genderPreference}</strong></span>
                            {prop.approvalNotes && (
                              <>
                                <span>•</span>
                                <span className="text-[#687586] italic">Notes: &quot;{prop.approvalNotes}&quot;</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`/property/${prop.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl text-[#687586] hover:text-[#102B50] hover:bg-white border border-transparent hover:border-[#E8E5DE] transition"
                            title="Preview Listing"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

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
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B] transition shadow-xs"
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
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10 transition"
                              >
                                Reject
                              </button>
                            </>
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
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10 transition"
                            >
                              Suspend Listing
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
                    <span>Food Service / Mess Moderation</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Review student mess outlets and tiffin partners. Approved vendors become discoverable for monthly passes.
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
                <div className="py-12 text-center text-xs text-[#687586]">Loading food vendor records...</div>
              ) : filteredMesses.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No mess outlets found for filter &quot;{messFilter}&quot;.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMesses.map((mess) => {
                    const isPending = (mess.approvalStatus || 'PENDING') === 'PENDING';
                    const isApproved = mess.approvalStatus === 'APPROVED';

                    return (
                      <div
                        key={mess.id}
                        className="p-5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#102B50] text-sm">{mess.name}</span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isApproved
                                  ? 'bg-[#21865B]/10 text-[#21865B] border-[#21865B]/20'
                                  : mess.approvalStatus === 'REJECTED'
                                  ? 'bg-[#D64545]/10 text-[#D64545] border-[#D64545]/20'
                                  : 'bg-[#F5A623]/10 text-[#D98200] border-[#F5A623]/20'
                              }`}
                            >
                              {mess.approvalStatus || 'PENDING'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#E8E5DE] text-[#102B50]">
                              FSSAI: {mess.fssaiNumber}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#687586] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {mess.address.street}, {mess.address.city}, {mess.address.state} - {mess.address.pincode}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1B6F4B] transition shadow-xs"
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
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#D64545] bg-white border border-[#D64545]/30 hover:bg-[#D64545]/10 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA ITEMS */}
          {activeTab === 'media' && (
            <div className="bg-white border border-[#E8E5DE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#F5A623]" />
                    <span>Media Upload Moderation</span>
                  </h2>
                  <p className="text-xs text-[#687586] mt-0.5">
                    Verify uploaded room, bathroom, kitchen, and common area photos.
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
                <div className="py-12 text-center text-xs text-[#687586]">Loading media queue...</div>
              ) : filteredMedia.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#687586] bg-[#FAF8F3] rounded-2xl border border-dashed border-[#E8E5DE]">
                  No media items pending moderation.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F3] space-y-3 flex flex-col justify-between"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/5">
                        <Image
                          src={item.url}
                          alt={item.originalFilename || 'Media item'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-[#102B50] block truncate">
                          {item.originalFilename || item.storageKey}
                        </span>
                        <span className="text-[11px] text-[#687586] block">
                          Area: {item.area || 'GENERAL'} • Type: {item.mediaType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Modal with Review Notes */}
          {reviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E5DE] space-y-4">
                <div className="flex items-center gap-2 text-[#173327]">
                  <ShieldCheck className="w-5 h-5 text-[#E06D3B]" />
                  <h3 className="font-extrabold text-base">
                    {reviewModal.action === 'APPROVE' && 'Confirm Approval'}
                    {reviewModal.action === 'REJECT' && 'Confirm Rejection'}
                    {reviewModal.action === 'ROLE_APPROVE' && 'Approve Partner Role Application'}
                    {reviewModal.action === 'ROLE_REJECT' && 'Reject Partner Role Application'}
                    {reviewModal.action === 'SUSPEND' && 'Suspend User Account'}
                    {reviewModal.action === 'ACTIVATE' && 'Reactivate User Account'}
                  </h3>
                </div>

                <p className="text-xs text-[#716D64]">
                  Target: <span className="font-bold text-[#173327]">{reviewModal.name}</span>
                </p>

                {reviewModal.action === 'SUSPEND' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Immediate Session Revocation</span>
                      <span className="text-[11px]">
                        Suspending this user will immediately invalidate and terminate all their active sessions across all devices.
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#173327] block mb-1.5">
                    Audit Notes & Justification (Recorded in append-only audit trail)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on verification steps taken, document numbers checked, or reason for action..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-[#E8E5DE] text-[#173327] bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#173327]"
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
                      moderateUserMutation.isPending ||
                      moderateRoleApprovalMutation.isPending
                    }
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition disabled:opacity-50"
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
