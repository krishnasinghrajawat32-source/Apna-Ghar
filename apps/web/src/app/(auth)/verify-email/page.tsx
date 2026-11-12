'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { User, UserRole } from '@apna-ghar/shared-types';

const verifyEmailSchema = z.object({
  otp: z
    .string()
    .length(6, 'Please enter all 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain numbers only'),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { setAuth } = useAuthStore();

  const [email] = useState(emailParam);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (data: VerifyEmailFormData) => {
    if (!email) {
      setServerError('Email address missing. Please return to login and try again.');
      return;
    }

    try {
      setServerError(null);
      const res = await apiClient<{ user: User; accessToken: string; message: string }>(
        '/auth/verify-email-otp',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            otp: data.otp,
          }),
        },
      );

      setAuth(res.user, res.accessToken);
      setSuccessMessage(res.message || 'Email verified successfully!');

      setTimeout(() => {
        if (res.user.role === UserRole.STUDENT) {
          router.push('/student/dashboard');
        } else if (res.user.role === UserRole.OWNER) {
          router.push('/owner/dashboard');
        } else if (res.user.role === UserRole.MESS_PARTNER) {
          router.push('/mess/dashboard');
        } else {
          router.push('/');
        }
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Verification failed. Please check the code and try again.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending || !email) return;

    try {
      setIsResending(true);
      setServerError(null);
      await apiClient<{ success: boolean; message: string }>('/auth/resend-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccessMessage('A fresh 6-digit OTP code has been dispatched to your inbox.');
      setCooldown(60);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Failed to resend code. Please wait a moment and try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-[#ECE8DD] rounded-xl sm:px-10">
      {successMessage && (
        <div className="mb-6 p-3.5 rounded-lg bg-[#F0F5F2] border border-[#173327]/20 flex items-start gap-2.5 text-xs text-[#173327]">
          <CheckCircle2 className="w-4 h-4 text-[#173327] shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#173327] mb-1">
            Registered Email
          </label>
          <div className="px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] bg-[#FAF9F5] text-[#3D3A33] font-medium">
            {email || 'No email specified'}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#173327]">
              6-Digit Verification Code
            </label>
            <span className="text-[11px] text-[#716D64]">Valid for 5 mins</span>
          </div>
          <input
            type="text"
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            {...register('otp')}
            className="w-full px-3.5 py-3 text-center text-lg font-mono font-bold tracking-[0.5em] rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
          />
          {errors.otp && (
            <p className="mt-1.5 text-[11px] text-red-600 font-medium text-center">
              {errors.otp.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!successMessage}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-sm disabled:opacity-70"
        >
          <ShieldCheck className="w-4 h-4" />
          {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div className="pt-2 flex items-center justify-between text-xs border-t border-[#ECE8DD]">
          <span className="text-[#716D64]">Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0 || isResending}
            className="font-semibold text-[#E06D3B] hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-[#ECE8DD] text-center text-xs text-[#3D3A33]">
        <Link href="/login" className="font-semibold text-[#173327] hover:underline inline-flex items-center gap-1">
          Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#FCFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-xl shadow-sm">
            AG
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#173327] tracking-tight">
          Verify your Email Address
        </h2>
        <p className="text-xs text-[#3D3A33]">
          We have dispatched a 6-digit cryptographic verification code to your email inbox
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#716D64]">Loading...</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
