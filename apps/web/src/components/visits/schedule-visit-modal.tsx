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
  const { data: slotsData, isLoading: slotsLoading } = useQuery<SlotsResponse>({
    queryKey: ['visit-slots', propertyId, selectedDate],
    queryFn: () =>
      apiClient<SlotsResponse>(
        `/visits/slots?propertyId=${propertyId}&date=${selectedDate}`,
      ),
    enabled: isOpen && !!propertyId && !!selectedDate,
  });

  const slots: { slot: string; available: boolean }[] =
    (slotsData as any)?.slots || (slotsData as any)?.data?.slots || [
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
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E5DE] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#102B50] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-[#F5A623] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Schedule a Free Property Visit</h3>
              <p className="text-xs text-white/70 truncate max-w-xs">{propertyName}</p>
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
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#21865B]/15 text-[#21865B] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#21865B]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xl font-black text-[#102B50]">Visit Request Confirmed!</h4>
              <p className="text-xs text-[#687586] max-w-sm mx-auto leading-relaxed">
                Your visit to <span className="font-bold text-[#102B50]">{propertyName}</span> has been requested for{' '}
                <span className="font-bold text-[#102B50]">{selectedDate}</span> during the{' '}
                <span className="font-bold text-[#102B50]">{selectedSlot}</span> slot.
              </p>
            </div>
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E8E5DE] text-xs text-[#263445] text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#102B50]">
                <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
                Zero Obligation Guarantee
              </div>
              <p className="text-[11px] text-[#687586]">
                Visiting is completely free. The property warden will meet you at the gate and guide you through the verified room options.
              </p>
            </div>
            <button
              onClick={handleModalClose}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-[#D64545]/10 border border-[#D64545]/30 rounded-2xl text-xs text-[#D64545] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D64545]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#F5A623]" />
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
                        ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                        : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:border-[#F5A623]'
                    }`}
                  >
                    <p className="text-[10px] font-semibold opacity-80">{d.dayName}</p>
                    <p className="text-xs font-bold">{d.formattedDate.split(' ')[0]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F5A623]" />
                Select 2-Hour Time Window:
              </label>
              {slotsLoading ? (
                <div className="py-4 text-center text-xs text-[#687586] animate-pulse">
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
                      className={`p-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                        !s.available
                          ? 'border-[#E8E5DE]/60 bg-[#E8E5DE]/30 text-[#687586]/60 cursor-not-allowed line-through'
                          : selectedSlot === s.slot
                          ? 'border-[#102B50] bg-[#102B50] text-white shadow-sm'
                          : 'border-[#E8E5DE] bg-[#FAF8F3] text-[#263445] hover:border-[#F5A623]'
                      }`}
                    >
                      <span>{s.slot}</span>
                      {s.available ? (
                        <span className={`text-[10px] font-bold ${selectedSlot === s.slot ? 'text-[#F5A623]' : 'text-[#21865B]'}`}>
                          Open
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#687586]">Full</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student Contact Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#F5A623]" />
                Your Mobile Number for Gate Entry:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E8E5DE] text-xs sm:text-sm text-[#263445] focus:outline-none focus:ring-2 focus:ring-[#F5A623] bg-[#FAF8F3]/50"
              />
              <p className="text-[10px] text-[#687586]">
                Shared only with the verified caretaker for gate pass and arrival coordination.
              </p>
            </div>

            {/* Special Instructions / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#F5A623]" />
                Special Requests or Questions (Optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Coming with parents, want to check AC twin sharing room..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5DE] text-xs text-[#263445] focus:outline-none focus:ring-2 focus:ring-[#F5A623] bg-[#FAF8F3]/50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={visitMutation.isPending}
              className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-98"
            >
              {visitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scheduling Visit...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Free Property Visit</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
