'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserRole } from '@apnaghar/shared-types';
import {
  ShieldCheck,
  DollarSign,
  Users,
  AlertTriangle,
  Scale,
  Check,
  X,
  FileText,
  UserX,
} from 'lucide-react';

export default function AdminConsolePage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'verifications' | 'disputes' | 'users' | 'commissions'>('verifications');

  // KYC queue
  const [kycItems, setKycItems] = useState([
    {
      id: 'kyc-1',
      propertyName: 'Green Villa Residency PG',
      ownerName: 'Lalit Sharma',
      docType: 'Registered Electricity Bill & Deed',
      submittedAt: '12-Aug-2026',
      status: 'PENDING',
    },
    {
      id: 'kyc-2',
      propertyName: 'Shree Krishna Girls Hostel',
      ownerName: 'Krishna Agarwal',
      docType: 'Municipal Property Tax Deed',
      submittedAt: '15-Aug-2026',
      status: 'VERIFIED',
    },
  ]);

  // Disputes queue
  const [disputes, setDisputes] = useState([
    {
      id: 'disp-1',
      bookingId: 'BK-2026-0941',
      studentName: 'Aryan Sharma',
      property: 'Royal Oxford PG',
      reason: 'AC unit non-functional for 5 consecutive days after move-in',
      claimAmount: 2500,
      status: 'OPEN',
    },
  ]);


  const handleApproveKyc = (id: string) => {
    setKycItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'VERIFIED' } : item)),
    );
    success('Property deed approved! Property granted Verified Stay badge.', 'KYC Approved');
  };

  const handleResolveDispute = (id: string) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'RESOLVED_STUDENT' } : d)),
    );
    success('Dispute arbitrated! ₹2,500 compensation refund awarded to student.', 'Arbitration Complete');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="admin" size="sm">Platform Super Admin</Badge>
            <span className="text-xs text-slate-400 font-mono">System Master Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Governance & Financial Analytics Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Arbitrate owner verification KYC, adjudicate tenant dispute refunds, and manage platform take-rates.
          </p>
        </div>
      </div>

      {/* Platform Financial & Integrity Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Platform GMV (Gross)</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatINR(4280000)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Platform Take-Rate Revenue (5%)</span>
          <div className="text-2xl font-black text-brand-400 font-mono mt-1">{formatINR(214000)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Registered Accounts</span>
          <div className="text-2xl font-black text-white font-mono mt-1">1,248</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Bed Occupancy Rate</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">89.2%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 space-x-2">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'verifications'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Owner KYC Verification Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'disputes'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Dispute Arbitration</span>
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">1 Pending</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Moderation</span>
        </button>
      </div>

      {/* TAB 1: KYC VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {kycItems.map((item) => (
            <Card key={item.id} className="border-slate-800">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'VERIFIED' ? 'verified' : 'warning'} size="sm">
                      {item.status}
                    </Badge>
                    <span className="text-slate-500">Submitted: {item.submittedAt}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{item.propertyName}</h4>
                  <p className="text-slate-400">
                    Owner: <span className="text-slate-200">{item.ownerName}</span> • Document: {item.docType}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Inspect Deed PDF
                  </Button>
                  {item.status !== 'VERIFIED' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => handleApproveKyc(item.id)}
                      className="text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Approve & Grant Badge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: DISPUTES ARBITRATION */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {disputes.map((disp) => (
            <Card key={disp.id} className="border-slate-800">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={disp.status === 'OPEN' ? 'danger' : 'success'} size="sm">
                      {disp.status}
                    </Badge>
                    <span className="text-slate-400 font-mono">{disp.bookingId}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Dispute: {disp.reason}
                  </h4>
                  <p className="text-slate-400">
                    Student: <span className="text-slate-200">{disp.studentName}</span> • Property: {disp.property}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Claim Amount</span>
                    <div className="text-base font-bold font-mono text-rose-400">
                      {formatINR(disp.claimAmount)}
                    </div>
                  </div>

                  {disp.status === 'OPEN' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => handleResolveDispute(disp.id)}
                      className="text-xs font-semibold"
                    >
                      Award Refund to Student
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: USER MODERATION */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card className="border-slate-800">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Security & Bad-Actor Account Moderation</h3>
              <p className="text-xs text-slate-400">
                Suspending an account immediately revokes all active JWT and refresh tokens stored in Redis (`user:sessions:userId`).
              </p>

              <div className="divide-y divide-slate-800 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">Aryan Sharma (Student)</span>
                    <p className="text-slate-400">student1@apnaghar.in • Status: ACTIVE</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => info('Session revoked for user.', 'Security Action')}
                    className="text-xs text-rose-300 border-rose-500/30"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Suspend & Revoke Tokens
                  </Button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">Lalit Sharma (Owner)</span>
                    <p className="text-slate-400">owner1@apnaghar.in • Status: ACTIVE</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => info('Session revoked for user.', 'Security Action')}
                    className="text-xs text-rose-300 border-rose-500/30"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Suspend & Revoke Tokens
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
