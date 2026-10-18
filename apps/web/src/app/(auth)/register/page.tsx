'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserCheck, AlertCircle, GraduationCap, Building2, UtensilsCrossed } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { User, UserRole } from '@apna-ghar/shared-types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[+]?[0-9]{10,14}$/, 'Please provide a valid 10-14 digit phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Must contain at least one letter and one number'),
  role: z.nativeEnum(UserRole),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.STUDENT,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      const res = await apiClient<{ user: User; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setAuth(res.user, res.accessToken);

      if (res.user.role === UserRole.STUDENT) {
        router.push('/student/dashboard');
      } else if (res.user.role === UserRole.OWNER) {
        router.push('/owner/dashboard');
      } else if (res.user.role === UserRole.MESS_PARTNER) {
        router.push('/mess/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-xl shadow-sm">
            AG
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#173327] tracking-tight">
          Create your Apna Ghar account
        </h2>
        <p className="text-xs text-[#3D3A33]">
          Har Sahar Apna Ghar — Join India's verified student accommodation network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#ECE8DD] rounded-xl sm:px-10">
          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Human-Friendly Role Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#173327]">
                How will you be using Apna Ghar?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', UserRole.STUDENT)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === UserRole.STUDENT
                      ? 'border-[#173327] bg-[#F0F5F2] ring-1 ring-[#173327]'
                      : 'border-[#ECE8DD] bg-white hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#DCE8E2] text-[#173327] flex items-center justify-center mb-2">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#173327]">Student</span>
                    <span className="text-[10px] text-[#3D3A33] leading-tight block mt-0.5">
                      I am looking for accommodation.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', UserRole.OWNER)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === UserRole.OWNER
                      ? 'border-[#173327] bg-[#F0F5F2] ring-1 ring-[#173327]'
                      : 'border-[#ECE8DD] bg-white hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#FAEBDE] text-[#E06D3B] flex items-center justify-center mb-2">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#173327]">Property Owner</span>
                    <span className="text-[10px] text-[#3D3A33] leading-tight block mt-0.5">
                      I manage a property.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', UserRole.MESS_PARTNER)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedRole === UserRole.MESS_PARTNER
                      ? 'border-[#173327] bg-[#F0F5F2] ring-1 ring-[#173327]'
                      : 'border-[#ECE8DD] bg-white hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-[#ECE8DD] text-[#3D3A33] flex items-center justify-center mb-2">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#173327]">Mess Partner</span>
                    <span className="text-[10px] text-[#3D3A33] leading-tight block mt-0.5">
                      I run a mess or tiffin service.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Input fields */}
            <div>
              <label className="block text-xs font-semibold text-[#173327] mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                {...register('name')}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#173327] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  {...register('email')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173327] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  {...register('phone')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173327] mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters (letters & numbers)"
                {...register('password')}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all"
              />
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-sm disabled:opacity-70"
            >
              <UserCheck className="w-4 h-4" />
              {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#ECE8DD] text-center text-xs text-[#3D3A33]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#E06D3B] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
