'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';

const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'Numbers only'),
});

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [challengeToken, setChallengeToken] = useState<string>(initialToken);
  const [step, setStep] = useState<'VERIFY_OTP' | 'SET_PASSWORD'>(
    initialToken ? 'SET_PASSWORD' : 'VERIFY_OTP',
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isSubmitting: isVerifyingOtp },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: initialEmail },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isResettingPassword },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  const onOtpSubmit = async (data: VerifyOtpFormData) => {
    try {
      setServerError(null);
      const res = await apiClient<{ success: boolean; challengeToken: string; message: string }>(
        '/auth/verify-reset-otp',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      );
      setChallengeToken(res.challengeToken);
      setStep('SET_PASSWORD');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Invalid OTP code. Please check and try again.');
      }
    }
  };

  const onPasswordSubmit = async (data: NewPasswordFormData) => {
    if (!challengeToken) {
      setServerError('Reset challenge token is missing. Please re-verify OTP.');
      setStep('VERIFY_OTP');
      return;
    }

    try {
      setServerError(null);
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: challengeToken,
          newPassword: data.newPassword,
        }),
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Unable to reset password. The challenge token may have expired.');
      }
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-[#ECE8DD] rounded-xl sm:px-10">
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-[#DCE8E2] text-[#173327] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#173327]">Password Reset Successful</h3>
          <p className="text-xs text-[#3D3A33] leading-relaxed">
            Your password has been securely updated and all previous active sessions have been terminated. Redirecting to login...
          </p>
          <div className="pt-4 border-t border-[#ECE8DD]">
            <Link
              href="/login"
              className="text-xs font-bold text-[#173327] hover:underline inline-flex items-center gap-1"
            >
              Sign In with New Password <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {step === 'VERIFY_OTP' ? (
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
              <div className="text-xs text-[#716D64] mb-2">
                Step 1 of 2 — Verify the 6-digit code sent to your registered email
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173327] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  {...registerOtp('email')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
                />
                {otpErrors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {otpErrors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173327] mb-1">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="654321"
                  {...registerOtp('otp')}
                  className="w-full px-3.5 py-2.5 text-center text-base font-mono font-bold tracking-[0.4em] rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
                />
                {otpErrors.otp && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-sm disabled:opacity-70"
              >
                <KeyRound className="w-4 h-4" />
                {isVerifyingOtp ? 'Verifying Code...' : 'Verify Code & Continue'}
              </button>

              <div className="pt-2 text-center text-xs">
                <Link href="/forgot-password" className="text-[#E06D3B] hover:underline font-semibold">
                  Need a new code? Request again
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="text-xs text-[#716D64] mb-2">
                Step 2 of 2 — Set your new secure password
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173327] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters (letters & numbers)"
                  {...registerPassword('newPassword')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173327] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter your new password"
                  {...registerPassword('confirmPassword')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isResettingPassword}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-sm disabled:opacity-70"
              >
                <Lock className="w-4 h-4" />
                {isResettingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-[#ECE8DD] text-center text-xs text-[#3D3A33]">
            Remember your credentials?{' '}
            <Link href="/login" className="font-bold text-[#E06D3B] hover:underline">
              Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FCFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-xl shadow-sm">
            AG
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#173327] tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-[#3D3A33]">
          Verify your identity with the OTP code and set your new password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#716D64]">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
