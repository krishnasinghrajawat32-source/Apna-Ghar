'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  Calendar,
  IndianRupee,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Filter,
  Eye,
  FileCheck,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  UserRole,
  AdminOverviewStats,
  AdminTrustAuditItem,
  Review as IReview,
  ReviewStatus,
  VerificationType,
  VerificationStatus,
} from '@apna-ghar/shared-types';

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}

function AdminDashboardContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'audits' | 'reviews'>('overview');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuditProperty, setSelectedAuditProperty] = useState<AdminTrustAuditItem | null>(null);
  const [checkpointNote, setCheckpointNote] = useState('');
  const [activeCheckpointType, setActiveCheckpointType] = useState<VerificationType | null>(null);

  // 1. Fetch Overview KPIs
  const { data: stats, isLoading: statsLoading } = useQuery<AdminOverviewStats>({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient<AdminOverviewStats>('/admin/overview'),
  });

  // 2. Fetch Trust Audits Queue
  const { data: trustAudits = [], isLoading: auditsLoading } = useQuery<AdminTrustAuditItem[]>({
    queryKey: ['admin-trust-audits'],
    queryFn: () => apiClient<AdminTrustAuditItem[]>('/admin/trust-audits'),
  });

  // 3. Fetch Reviews Queue
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<IReview[]>({
    queryKey: ['admin-reviews'],
    queryFn: () => apiClient<IReview[]>('/admin/reviews'),
  });

  // Checkpoint Audit Mutation
  const verifyCheckpointMutation = useMutation({
    mutationFn: (vars: {
      propertyId: string;
      type: VerificationType;
      status: VerificationStatus;
      notes?: string;
    }) =>
      apiClient(`/admin/trust-audits/${vars.propertyId}/checkpoint`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: vars.type,
          status: vars.status,
          notes: vars.notes,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trust-audits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setActiveCheckpointType(null);
      setCheckpointNote('');
      // Update selected property if currently inspecting
      if (selectedAuditProperty) {
        // refetch will automatically update state
      }
    },
  });

  // Review Moderation Mutation
  const moderateReviewMutation = useMutation({
    mutationFn: (vars: { reviewId: string; status: ReviewStatus; moderationNote?: string }) =>
      apiClient(`/admin/reviews/${vars.reviewId}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: vars.status,
          moderationNote: vars.moderationNote,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });

  // Format Checkpoint Label
  const formatCheckpointName = (type: VerificationType): string => {
    switch (type) {
      case VerificationType.OWNER_IDENTITY:
        return '1. Owner KYC & Identity';
      case VerificationType.LOCATION:
        return '2. Physical GPS Location';
      case VerificationType.PHOTOS:
        return '3. Visual Photo Fidelity';
      case VerificationType.PRICING:
        return '4. Zero Hidden Charges Agreement';
      case VerificationType.AMENITIES:
        return '5. Amenities & Power Backup';
      case VerificationType.INVENTORY:
        return '6. Room & Bed Inventory Match';
      case VerificationType.DOCUMENTS:
        return '7. Lease & Police Verification';
      default:
        return type;
    }
  };

  // Filtered properties for audit queue
  const filteredAudits = trustAudits.filter((item) =>
    item.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FCFBF7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ECE8DD]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#173327] text-white">
                <ShieldCheck className="w-4 h-4 text-[#E06D3B]" />
                Platform Governance & Admin
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173327] tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-xs text-[#3D3A33]">
              Real-time governance: Trust Passport 7-point physical audits, resident review moderation, and marketplace KPIs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#173327] bg-white border border-[#ECE8DD] hover:bg-[#F0F5F2] transition-colors"
            >
              <span>Explore Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#ECE8DD]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-[#173327] text-[#173327]'
                : 'border-transparent text-[#3D3A33] hover:text-[#173327]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Platform Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('audits')}
            className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'audits'
                ? 'border-[#173327] text-[#173327]'
                : 'border-transparent text-[#3D3A33] hover:text-[#173327]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Trust Passport Audits</span>
            {stats?.pendingTrustAudits ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E06D3B] text-white font-bold">
                {stats.pendingTrustAudits}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-[#173327] text-[#173327]'
                : 'border-transparent text-[#3D3A33] hover:text-[#173327]'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Review Moderation</span>
            {stats?.pendingReviews ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {stats.pendingReviews}
              </span>
            ) : null}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-[#173327]" />
                </div>
                <div className="text-2xl font-black text-[#173327]">
                  {statsLoading ? '—' : stats?.totalUsers}
                </div>
                <div className="text-[11px] text-gray-500">
                  {stats?.totalStudents || 0} Students • {stats?.totalOwners || 0} Owners
                </div>
              </div>

              <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Properties</span>
                  <Building2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-[#173327]">
                  {statsLoading ? '—' : stats?.totalProperties}
                </div>
                <div className="text-[11px] text-gray-500">
                  Verified accommodations
                </div>
              </div>

              <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Active Bookings</span>
                  <Calendar className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-2xl font-black text-[#173327]">
                  {statsLoading ? '—' : stats?.activeBookings}
                </div>
                <div className="text-[11px] text-gray-500">
                  Confirmed active stays
                </div>
              </div>

              <div className="bg-white border border-[#ECE8DD] rounded-2xl p-5 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total GTV</span>
                  <IndianRupee className="w-4 h-4 text-[#E06D3B]" />
                </div>
                <div className="text-2xl font-black text-[#173327]">
                  {statsLoading ? '—' : formatCurrency(stats?.grossTransactionVolume || 0)}
                </div>
                <div className="text-[11px] text-gray-500">
                  Processed via gateway
                </div>
              </div>
            </div>

            {/* Quick Action Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-[#ECE8DD] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-[#E06D3B]" />
                    <h3 className="text-sm font-bold text-[#173327]">Trust Passport Verification Queue</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FBF0EA] text-[#E06D3B]">
                    {stats?.pendingTrustAudits || 0} Pending
                  </span>
                </div>
                <p className="text-xs text-[#3D3A33]">
                  Properties awaiting auditor inspection for 7-point physical checks including Aadhaar KYC, fire safety, and Wi-Fi speed.
                </p>
                <button
                  onClick={() => setActiveTab('audits')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors cursor-pointer"
                >
                  <span>Review Audit Queue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white border border-[#ECE8DD] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-[#173327]">Resident Review Moderation</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800">
                    {reviews.length} Total Reviews
                  </span>
                </div>
                <p className="text-xs text-[#3D3A33]">
                  All student reviews are backed by confirmed booking references with zero fake or sponsored content permitted.
                </p>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#173327] bg-[#F0F5F2] hover:bg-[#DCE8E2] transition-colors cursor-pointer"
                >
                  <span>Moderate Reviews</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRUST PASSPORT AUDITS */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            {/* Search & Stats Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by property, city or owner name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white border border-[#ECE8DD] focus:outline-none focus:ring-2 focus:ring-[#173327]/20 text-[#173327]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Showing {filteredAudits.length} properties</span>
              </div>
            </div>

            {/* Properties Audit Table / Cards */}
            {auditsLoading ? (
              <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-[#ECE8DD]">
                Loading Trust Passport audits...
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-[#ECE8DD]">
                No properties match the search criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAudits.map((item) => (
                  <div
                    key={item.propertyId}
                    className="bg-white border border-[#ECE8DD] rounded-2xl p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#173327]">
                            {item.propertyName}
                          </h3>
                          <Link
                            href={`/property/${item.slug}`}
                            target="_blank"
                            className="text-gray-400 hover:text-[#173327] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {item.isFullyVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3EE] text-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Gold Certified (7/7)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF0EA] text-[#E06D3B]">
                              <Clock className="w-3 h-3" />
                              Audit in Progress ({item.verifiedCheckpoints}/7)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>City: <strong className="text-[#173327]">{item.city}</strong></span>
                          <span>Owner: <strong className="text-[#173327]">{item.ownerName}</strong></span>
                          {item.ownerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" /> {item.ownerPhone}
                            </span>
                          )}
                          {item.ownerEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" /> {item.ownerEmail}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setSelectedAuditProperty(
                              selectedAuditProperty?.propertyId === item.propertyId ? null : item
                            )
                          }
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#173327] bg-[#F0F5F2] hover:bg-[#DCE8E2] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>
                            {selectedAuditProperty?.propertyId === item.propertyId
                              ? 'Hide Checkpoints'
                              : 'Inspect Checkpoints'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#ECE8DD] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(item.verifiedCheckpoints / 7) * 100}%` }}
                      />
                    </div>

                    {/* Expanded 7-Point Checkpoints Inspector */}
                    {selectedAuditProperty?.propertyId === item.propertyId && (
                      <div className="pt-4 border-t border-[#ECE8DD] space-y-3">
                        <h4 className="text-xs font-bold text-[#173327] uppercase tracking-wider">
                          7-Point Trust Passport Checkpoints
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.checkpoints.map((cp) => (
                            <div
                              key={cp.type}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                cp.status === VerificationStatus.VERIFIED
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : cp.status === VerificationStatus.REJECTED
                                  ? 'bg-red-50/50 border-red-200'
                                  : 'bg-[#FCFBF7] border-[#ECE8DD]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#173327]">
                                  {formatCheckpointName(cp.type)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cp.status === VerificationStatus.VERIFIED
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : cp.status === VerificationStatus.REJECTED
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {cp.status}
                                </span>
                              </div>

                              <p className="text-[11px] text-gray-600">
                                {cp.notes || 'No auditor notes recorded yet.'}
                              </p>

                              {cp.verifiedAt && (
                                <p className="text-[10px] text-gray-400">
                                  Verified on: {new Date(cp.verifiedAt).toLocaleDateString('en-IN')}
                                </p>
                              )}

                              {/* Interactive Audit Action */}
                              {activeCheckpointType === cp.type ? (
                                <div className="space-y-2 pt-2 border-t border-[#ECE8DD]">
                                  <input
                                    type="text"
                                    placeholder="Enter auditor verification notes or reason..."
                                    value={checkpointNote}
                                    onChange={(e) => setCheckpointNote(e.target.value)}
                                    className="w-full text-xs p-2 rounded-lg border border-[#ECE8DD] bg-white focus:outline-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={verifyCheckpointMutation.isPending}
                                      onClick={() =>
                                        verifyCheckpointMutation.mutate({
                                          propertyId: item.propertyId,
                                          type: cp.type,
                                          status: VerificationStatus.VERIFIED,
                                          notes: checkpointNote || 'Audited and verified compliant',
                                        })
                                      }
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer disabled:opacity-50"
                                    >
                                      Confirm Verified
                                    </button>
                                    <button
                                      type="button"
                                      disabled={verifyCheckpointMutation.isPending}
                                      onClick={() =>
                                        verifyCheckpointMutation.mutate({
                                          propertyId: item.propertyId,
                                          type: cp.type,
                                          status: VerificationStatus.REJECTED,
                                          notes: checkpointNote || 'Non-compliant with safety guidelines',
                                        })
                                      }
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-700 hover:bg-red-800 cursor-pointer disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveCheckpointType(null);
                                        setCheckpointNote('');
                                      }}
                                      className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCheckpointType(cp.type);
                                      setCheckpointNote(cp.notes || '');
                                    }}
                                    className="text-[11px] font-bold text-[#173327] hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <FileCheck className="w-3.5 h-3.5 text-[#E06D3B]" />
                                    <span>Update Audit Status</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEW MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#173327]">Resident Reviews Moderation Table</h2>
                <p className="text-xs text-[#3D3A33]">
                  Inspect student reviews across all accommodations. Approved reviews directly influence property scores.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {reviews.length} Total Reviews
              </span>
            </div>

            {reviewsLoading ? (
              <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-[#ECE8DD]">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-[#ECE8DD]">
                No student reviews recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white border border-[#ECE8DD] rounded-xl p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#173327]">
                            {rev.studentName || 'Resident Student'}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            reviewed <strong>{rev.propertyName || 'Property'}</strong>
                          </span>
                          {rev.verifiedStay && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3EE] text-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Verified Stay
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          Booking ID: {rev.bookingId} • Submitted: {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-[#FCFBF7] px-2.5 py-1 rounded-lg border border-[#ECE8DD]">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="text-xs font-black text-[#173327]">{rev.rating}.0</span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            rev.status === ReviewStatus.APPROVED
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.status === ReviewStatus.REJECTED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rev.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#3D3A33] bg-[#FCFBF7] p-3 rounded-lg border border-[#ECE8DD]/60">
                      &quot;{rev.comment}&quot;
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>Cleanliness: <strong>{rev.cleanlinessRating}/5</strong></span>
                        <span>•</span>
                        <span>Food: <strong>{rev.foodRating}/5</strong></span>
                        <span>•</span>
                        <span>Safety: <strong>{rev.safetyRating}/5</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        {rev.status !== ReviewStatus.APPROVED && (
                          <button
                            type="button"
                            disabled={moderateReviewMutation.isPending}
                            onClick={() =>
                              moderateReviewMutation.mutate({
                                reviewId: rev.id,
                                status: ReviewStatus.APPROVED,
                              })
                            }
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {rev.status !== ReviewStatus.REJECTED && (
                          <button
                            type="button"
                            disabled={moderateReviewMutation.isPending}
                            onClick={() =>
                              moderateReviewMutation.mutate({
                                reviewId: rev.id,
                                status: ReviewStatus.REJECTED,
                                moderationNote: 'Content flagged as inappropriate',
                              })
                            }
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject / Flag</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
