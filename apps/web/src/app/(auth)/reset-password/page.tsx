'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';

const resetPasswordSchema = z
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Reset token is missing or invalid.');
      return;
    }

    try {
      setServerError(null);
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
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
        setServerError('Unable to reset password. The link may have expired.');
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
            Your password has been securely updated. Redirecting you to login...
          </p>
          <div className="pt-4 border-t border-[#ECE8DD]">
            <Link
              href="/login"
              className="text-xs font-bold text-[#173327] hover:underline"
            >
              Go to Sign In now
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#173327] mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('newPassword')}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
              />
              {errors.newPassword && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173327] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-sm disabled:opacity-70"
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
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
          Create new password
        </h2>
        <p className="text-xs text-[#3D3A33]">
          Please enter and confirm your new secure account password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white py-12 px-6 shadow-sm border border-[#ECE8DD] rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#173327] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
