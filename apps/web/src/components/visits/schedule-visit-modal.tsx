'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

interface SlotsResponse {
  date: string;
  slots: { slot: string; available: boolean }[];
}

export function ScheduleVisitModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
}: ScheduleVisitModalProps) {
  const queryClient = useQueryClient();

  // Helper: next 7 days dates in YYYY-MM-DD
  const availableDates = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() + index + 1); // Start from tomorrow
    return {
      isoString: d.toISOString().split('T')[0] || '',
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      formattedDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates[0]?.isoString || '',
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00-12:00');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Live query for available slots on chosen date
  const { data: slotsData, isLoading: slotsLoading } = useQuery<{ success: boolean; data: SlotsResponse }>({
    queryKey: ['visit-slots', propertyId, selectedDate],
    queryFn: () =>
      apiClient<{ success: boolean; data: SlotsResponse }>(
        `/visits/slots?propertyId=${propertyId}&date=${selectedDate}`,
      ),
    enabled: isOpen && !!propertyId && !!selectedDate,
  });

  const slots = slotsData?.data?.slots || [
    { slot: '10:00-12:00', available: true },
    { slot: '12:00-14:00', available: true },
    { slot: '14:00-16:00', available: true },
    { slot: '16:00-18:00', available: true },
  ];

  // Schedule visit mutation
  const visitMutation = useMutation({
    mutationFn: () =>
      apiClient('/visits', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          scheduledDate: selectedDate,
          slot: selectedSlot,
          contactPhone: phone,
          notes: notes.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      setSuccess(true);
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['student-visits'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to schedule visit. Please verify your contact details and try again.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg('Please provide a valid contact phone number for the property caretaker.');
      return;
    }
    setErrorMsg('');
    visitMutation.mutate();
  };

  const handleModalClose = () => {
    setSuccess(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#ECE8DD] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#173327] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#234E3C] text-[#E06D3B] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Schedule a Free Property Visit</h3>
              <p className="text-xs text-emerald-100/80 truncate max-w-xs">{propertyName}</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#DCE8E2] text-[#173327] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#173327]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-[#173327]">Visit Request Confirmed!</h4>
              <p className="text-xs text-[#3D3A33] max-w-sm mx-auto leading-relaxed">
                Your visit to <span className="font-semibold">{propertyName}</span> has been requested for{' '}
                <span className="font-semibold">{selectedDate}</span> during the{' '}
                <span className="font-semibold">{selectedSlot}</span> slot.
              </p>
            </div>
            <div className="p-4 bg-[#FCFBF7] rounded-xl border border-[#ECE8DD] text-xs text-[#3D3A33] text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#173327]">
                <ShieldCheck className="w-4 h-4 text-[#E06D3B]" />
                Zero Obligation Guarantee
              </div>
              <p className="text-[11px]">
                Visiting is completely free. The property warden will meet you at the gate and guide you through the verified room options.
              </p>
            </div>
            <button
              onClick={handleModalClose}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#173327] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E06D3B]" />
                Select Preferred Visit Date:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {availableDates.map((d) => (
                  <button
                    key={d.isoString}
                    type="button"
                    onClick={() => setSelectedDate(d.isoString)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      selectedDate === d.isoString
                        ? 'border-[#173327] bg-[#173327] text-white shadow-xs'
                        : 'border-[#ECE8DD] bg-[#FCFBF7] text-[#3D3A33] hover:border-gray-300'
                    }`}
                  >
                    <p className="text-[10px] font-medium opacity-80">{d.dayName}</p>
                    <p className="text-xs font-bold">{d.formattedDate.split(' ')[0]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#173327] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E06D3B]" />
                Select 2-Hour Time Window:
              </label>
              {slotsLoading ? (
                <div className="py-4 text-center text-xs text-gray-500 animate-pulse">
                  Checking real-time slot availability...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.slot}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSelectedSlot(s.slot)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                        !s.available
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                          : selectedSlot === s.slot
                          ? 'border-[#173327] bg-[#173327] text-white shadow-xs'
                          : 'border-[#ECE8DD] bg-[#FCFBF7] text-[#3D3A33] hover:border-gray-300'
                      }`}
                    >
                      <span>{s.slot}</span>
                      {s.available ? (
                        <span className={`text-[10px] font-bold ${selectedSlot === s.slot ? 'text-emerald-100' : 'text-emerald-700'}`}>
                          Open
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Full</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student Contact Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#173327] flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#E06D3B]" />
                Your Mobile Number for Gate Entry:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD7C7] text-xs sm:text-sm text-[#173327] focus:outline-none focus:ring-2 focus:ring-[#173327]"
              />
              <p className="text-[10px] text-gray-500">
                Shared only with the verified caretaker for gate pass and arrival coordination.
              </p>
            </div>

            {/* Special Instructions / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#173327] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#E06D3B]" />
                Special Requests or Questions (Optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Coming with parents, want to check AC twin sharing room..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#DDD7C7] text-xs text-[#173327] focus:outline-none focus:ring-2 focus:ring-[#173327] resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={visitMutation.isPending}
              className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {visitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scheduling Visit...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Confirm Free Property Visit
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
