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
  Utensils,
  Clock,
  CheckCircle2,
  Truck,
  CookingPot,
  Plus,
  PauseCircle,
  Users,
} from 'lucide-react';

interface LiveOrder {
  id: string;
  orderCode: string;
  studentName: string;
  deliveryRoom: string;
  itemsSummary: string;
  totalAmount: number;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
}

export default function FoodPartnerPage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const { success } = useToast();

  const [orders, setOrders] = useState<LiveOrder[]>([
    {
      id: 'ord-1',
      orderCode: 'FO-2026-8812',
      studentName: 'Aryan Sharma',
      deliveryRoom: 'Green Villa PG, Room 101',
      itemsSummary: '1x Special North Indian Thali',
      totalAmount: 140,
      status: 'PLACED',
    },
    {
      id: 'ord-2',
      orderCode: 'FO-2026-8813',
      studentName: 'Rohan Verma',
      deliveryRoom: 'Green Villa PG, Room 201',
      itemsSummary: '2x South Indian Combo Box',
      totalAmount: 220,
      status: 'PREPARING',
    },
  ]);


  const advanceOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        if (ord.status === 'PLACED') return { ...ord, status: 'ACCEPTED' };
        if (ord.status === 'ACCEPTED') return { ...ord, status: 'PREPARING' };
        if (ord.status === 'PREPARING') return { ...ord, status: 'OUT_FOR_DELIVERY' };
        if (ord.status === 'OUT_FOR_DELIVERY') return { ...ord, status: 'DELIVERED' };
        return ord;
      }),
    );
    success('Order status updated!', 'Kitchen Pipeline');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="food_partner" size="sm">Food Kitchen Partner</Badge>
            <span className="text-xs text-slate-400 font-mono">Annapurna Student Kitchens</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kitchen Operations & Meal Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage live tiffin delivery pipeline, daily menu offerings, and monthly student subscribers.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Active Monthly Subscribers</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">42</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Meals on Vacation Pause</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">6 (Paused)</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Today's Meals to Prepare</span>
          <div className="text-2xl font-black text-white font-mono mt-1">108</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Today's Kitchen Revenue</span>
          <div className="text-2xl font-black text-brand-400 font-mono mt-1">{formatINR(14850)}</div>
        </div>
      </div>

      {/* Live Orders Dispatch Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CookingPot className="w-5 h-5 text-emerald-400" />
            <span>Live Student Order Dispatch Queue</span>
          </h2>
          <span className="text-xs text-slate-400">Auto-refreshing every 10 seconds</span>
        </div>

        <div className="space-y-3">
          {orders.map((ord) => (
            <Card key={ord.id} className="border-slate-800">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ord.status === 'DELIVERED'
                          ? 'success'
                          : ord.status === 'PREPARING'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {ord.status.replace('_', ' ')}
                    </Badge>
                    <span className="font-mono text-slate-400 font-bold">{ord.orderCode}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {ord.itemsSummary}
                  </h4>
                  <p className="text-slate-400">
                    Recipient: <span className="text-slate-200">{ord.studentName}</span> • {ord.deliveryRoom}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {formatINR(ord.totalAmount)}
                  </span>
                  {ord.status !== 'DELIVERED' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => advanceOrderStatus(ord.id)}
                      className="text-xs font-semibold"
                    >
                      {ord.status === 'PLACED' && 'Accept Order'}
                      {ord.status === 'ACCEPTED' && 'Start Cooking'}
                      {ord.status === 'PREPARING' && 'Out for Delivery'}
                      {ord.status === 'OUT_FOR_DELIVERY' && 'Mark Delivered'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
