'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { UserRole } from '@apnaghar/shared-types';
import {
  Building,
  Plus,
  ShieldCheck,
  Calendar,
  Layers,
  Check,
  X,
  Upload,
  Clock,
} from 'lucide-react';

export default function OwnerPortalPage() {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'inventory' | 'kyc' | 'visits'>('inventory');

  // Register Property Modal
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropType, setNewPropType] = useState('PG');


  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddPropModalOpen(false);
    success(`"${newPropName}" registered! Submit verification deed to activate.`, 'Property Created');
    setNewPropName('');
    setNewPropAddress('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Owner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="owner" size="sm">Property Owner / PG Manager</Badge>
            <span className="text-xs text-slate-400 font-mono">ID: AG-OWN-2026-012</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Owner Inventory & Tenant Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure room types, manage physical bed occupancy, submit property deeds, and approve student visits.
          </p>
        </div>

        <Button
          variant="emerald"
          size="md"
          onClick={() => setIsAddPropModalOpen(true)}
          className="text-xs font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Property
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Properties</span>
          <div className="text-2xl font-black text-white font-mono mt-1">2</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Beds Managed</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">24</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Occupancy Rate</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">87.5%</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Monthly Net Payouts</span>
          <div className="text-2xl font-black text-brand-400 font-mono mt-1">{formatINR(264000)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 space-x-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'inventory'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Properties & Beds</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'kyc'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification & Deeds</span>
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'visits'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Student Visit Requests</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">1 Pending</span>
        </button>
      </div>

      {/* TAB 1: PROPERTIES & BEDS INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <Card className="border-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="verified" size="sm">Verified Active</Badge>
                    <span className="text-xs text-slate-500 font-mono">12 Beds (10 Occupied, 2 Available)</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Green Villa Residency PG</h3>
                  <p className="text-xs text-slate-400">12-A, Kalu Sarai, Near Hauz Khas Metro</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    Configure Rooms
                  </Button>
                </div>
              </div>

              {/* Hierarchical Inventory View */}
              <div className="mt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">Room Hierarchy Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white">Room 101 (Single AC)</span>
                      <span className="font-mono text-emerald-400">{formatINR(14000)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold">
                        Bed A: OCCUPIED
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white">Room 201 (Double AC)</span>
                      <span className="font-mono text-emerald-400">{formatINR(9500)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                        Bed A: AVAILABLE
                      </span>
                      <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold">
                        Bed B: OCCUPIED
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white">Room 202 (Double AC)</span>
                      <span className="font-mono text-emerald-400">{formatINR(9500)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Bed A: HELD
                      </span>
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                        Bed B: AVAILABLE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: KYC & DEEDS */}
      {activeTab === 'kyc' && (
        <div className="max-w-2xl space-y-4">
          <Card className="border-slate-800">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Upload Property Ownership Deed</h3>
              <p className="text-xs text-slate-400">
                To earn the Apna Ghar Verified Badge and receive direct bookings, upload registered electricity bill or property title deed.
              </p>

              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-950/60 hover:border-emerald-500 transition cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">Drop ownership PDF / Deed image here</p>
                <p className="text-[11px] text-slate-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 10MB)</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Green Villa Residency deed verified by Super Admin on 12-Aug-2026.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: VISITS */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <Card className="border-slate-800">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">PENDING CONFIRMATION</Badge>
                  <span className="text-slate-400">Scheduled for Tomorrow, 10:00 AM – 12:00 PM</span>
                </div>
                <h4 className="text-sm font-bold text-white">Student Visit: Aryan Sharma (IIT Delhi)</h4>
                <p className="text-slate-400">Green Villa Residency • Interested in Single Deluxe AC</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => success('Visit approved! Gate pass code issued.', 'Visit Approved')}
                  className="text-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Approve Entry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => info('Reschedule requested.', 'Reschedule')}
                  className="text-xs"
                >
                  Reschedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Property Modal */}
      <Modal
        isOpen={isAddPropModalOpen}
        onClose={() => setIsAddPropModalOpen(false)}
        maxWidth="md"
        title="Register New Accommodation"
        description="Add a new property to the Apna Ghar directory."
      >
        <form onSubmit={handleCreateProperty} className="space-y-4 pt-2">
          <Input
            label="Property Name"
            placeholder="e.g. Royal Oxford Student PG"
            required
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
          />
          <Input
            label="Street Address"
            placeholder="e.g. 55, Near Metro Pillar 84"
            required
            value={newPropAddress}
            onChange={(e) => setNewPropAddress(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Property Type</label>
            <select
              value={newPropType}
              onChange={(e) => setNewPropType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="PG">Paying Guest (PG)</option>
              <option value="HOSTEL">Student Hostel</option>
              <option value="SHARED_ACCOMMODATION">Shared Student Flat</option>
            </select>
          </div>
          <Button type="submit" variant="emerald" size="md" className="w-full text-xs font-bold">
            Create Property Record
          </Button>
        </form>
      </Modal>
    </div>
  );
}
