'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserRole } from '@apnaghar/shared-types';
import {
  Home,
  Calendar,
  Utensils,
  MessageSquare,
  Clock,
  ShieldCheck,
  Pause,
  Play,
  Send,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function StudentPortalPage() {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'bookings' | 'visits' | 'food' | 'chat'>('bookings');

  // Vacation Pause State
  const [isMealPaused, setIsMealPaused] = useState(false);

  // Chat message state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Landlord (Mr. Sharma)', text: 'Hello Aryan! Welcome to Green Villa Residency.', time: '10:30 AM' },
    { sender: 'You', text: 'Thank you! What time does the front biometric gate close at night?', time: '10:32 AM' },
    { sender: 'Landlord (Mr. Sharma)', text: 'The biometric gate operates 24/7 with CCTV. You can enter anytime with your fingerprint.', time: '10:35 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'You', text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Landlord (Mr. Sharma)',
          text: 'Got your message! I will assist you right away.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  const handleToggleMealPause = () => {
    if (isMealPaused) {
      setIsMealPaused(false);
      success('Meal subscription resumed. Deliveries will restart tomorrow!', 'Subscription Active');
    } else {
      setIsMealPaused(true);
      info('Vacation pause activated. Your daily meal credits are safeguarded!', 'Subscription Paused');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="student" size="sm">Student Resident</Badge>
            <span className="text-xs text-slate-400 font-mono">ID: AG-STU-2026-081</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Living Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your active bed bookings, scheduled physical visits, vacation meal pauses, and landlord chats.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 my-6 space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'bookings'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>My Bookings</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">1</span>
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
          <span>Scheduled Visits</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">1</span>
        </button>

        <button
          onClick={() => setActiveTab('food')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'food'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Meal Subscriptions</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'chat'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Landlord Chat</span>
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <Card className="border-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="success" size="sm">CONFIRMED STAY</Badge>
                    <span className="text-xs text-slate-500 font-mono">#BK-2026-0941</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Green Villa Residency PG</h3>
                  <p className="text-xs text-slate-400">12-A, Kalu Sarai, Near Hauz Khas Metro (650m to IIT)</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Monthly Rent</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">{formatINR(14000)}/mo</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 text-xs">
                <div>
                  <span className="text-slate-400">Assigned Bed:</span>
                  <p className="font-bold text-white mt-0.5">Room 101 • Bed A (Single Deluxe AC)</p>
                </div>
                <div>
                  <span className="text-slate-400">Stay Duration:</span>
                  <p className="font-bold text-white mt-0.5">6 Months (Aug 2026 – Jan 2027)</p>
                </div>
                <div>
                  <span className="text-slate-400">Payment Status:</span>
                  <p className="font-bold text-emerald-400 mt-0.5">Paid via Razorpay</p>
                </div>
                <div>
                  <span className="text-slate-400">Security Deposit:</span>
                  <p className="font-bold text-white mt-0.5 font-mono">{formatINR(14000)} (Refundable)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Eligible for 100% full security deposit refund under Apna Ghar Guarantee.</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => info('Refund calculation preview: 100% refundable (>15 days).', 'Refund Preview')}
                  className="text-xs text-rose-300 hover:text-rose-200 border-rose-500/30"
                >
                  Cancellation & Refund Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: VISITS */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <Card className="border-slate-800">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">CONFIRMED VISIT</Badge>
                  <span className="text-xs text-slate-500">Tomorrow at 10:00 AM</span>
                </div>
                <h3 className="text-base font-bold text-white">Shree Krishna Girls Hostel</h3>
                <p className="text-xs text-slate-400">44, Vijay Nagar, North Campus, Delhi</p>
                <p className="text-[11px] text-emerald-400 font-medium">Gate Pass Generated: Entry Code #GP-8419</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => success('Visit rescheduled request sent.', 'Rescheduled')}
                className="text-xs"
              >
                Reschedule Slot
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: FOOD SUBSCRIPTIONS */}
      {activeTab === 'food' && (
        <div className="space-y-6">
          <Card className="border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={isMealPaused ? 'warning' : 'success'} size="sm">
                      {isMealPaused ? 'PAUSED (VACATION)' : 'ACTIVE PLAN'}
                    </Badge>
                    <span className="text-xs text-slate-500">Apna Ghar Kitchens</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Full Student Monthly Subscription</h3>
                  <p className="text-xs text-slate-400">Includes daily Breakfast, Lunch, and Dinner delivered to Room 101</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Billing Cycle</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">{formatINR(3499)}/mo</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-white block mb-0.5">Vacation Meal Protection</span>
                  <span className="text-slate-400">
                    {isMealPaused
                      ? 'Your subscription is currently paused. No meals will be delivered and no credits are consumed.'
                      : 'Going home for holidays? Pause deliveries so zero food or money is wasted.'}
                  </span>
                </div>

                <Button
                  variant={isMealPaused ? 'emerald' : 'outline'}
                  size="sm"
                  onClick={handleToggleMealPause}
                  className="text-xs font-semibold shrink-0"
                >
                  {isMealPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Resume Meal Deliveries
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      Pause Plan (Going on Vacation)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: CHAT */}
      {activeTab === 'chat' && (
        <div className="max-w-3xl mx-auto">
          <Card className="border-slate-800 flex flex-col h-[520px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  LS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mr. Sharma (Property Landlord)</h4>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Green Villa Residency
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, idx) => {
                const isMe = msg.sender === 'You';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Ask about keys, Wi-Fi passwords, or rules..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <Button type="submit" variant="emerald" size="sm" className="px-4">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
