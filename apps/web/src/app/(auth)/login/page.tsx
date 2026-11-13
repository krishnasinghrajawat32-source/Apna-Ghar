'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  GraduationCap,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Bed,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { User, UserRole, AccountStatus } from '@apna-ghar/shared-types';

const REMEMBER_ME_EMAIL_KEY = 'apna_ghar_saved_student_email';

const studentLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid student email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

type StudentLoginFormData = z.infer<typeof studentLoginSchema>;

interface RoleMismatchInfo {
  detectedRole: UserRole;
  roleTitle: string;
  userEmail: string;
  portalUrl: string;
  portalName: string;
}

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { setAuth, clearAuth } = useAuthStore();
  const roleParam = searchParams.get('role');

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    roleParam === 'OWNER'
      ? UserRole.OWNER
      : roleParam === 'MESS_PARTNER' || roleParam === 'VENDOR'
      ? UserRole.MESS_PARTNER
      : UserRole.STUDENT
  );

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [roleMismatch, setRoleMismatch] = useState<RoleMismatchInfo | null>(null);
  const [isSlowNotice, setIsSlowNotice] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Load saved email on mount and pre-warm backend API
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedEmail = localStorage.getItem(REMEMBER_ME_EMAIL_KEY);
        if (savedEmail) {
          setValue('email', savedEmail);
          setValue('rememberMe', true);
        }
      }
    } catch {
      // Ignore localStorage availability errors
    }

    // Ping health check to awaken cold start instances smoothly
    apiClient('/health').catch(() => {});
  }, [setValue]);

  // Notice for slow networks / backend cold boots
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitting) {
      timer = setTimeout(() => setIsSlowNotice(true), 2500);
    } else {
      setIsSlowNotice(false);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  const onSubmit = async (data: StudentLoginFormData) => {
    try {
      setServerError(null);
      setUnverifiedEmail(null);
      setRoleMismatch(null);

      // Secure "Remember Me" handling: save ONLY email to localStorage
      try {
        if (typeof window !== 'undefined') {
          if (data.rememberMe) {
            localStorage.setItem(REMEMBER_ME_EMAIL_KEY, data.email.trim());
          } else {
            localStorage.removeItem(REMEMBER_ME_EMAIL_KEY);
          }
        }
      } catch {
        // Ignore storage exceptions
      }

      // Real backend authentication
      const res = await apiClient<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });

      const user = res.user;

      // Handle unverified or suspended accounts
      if (user.accountStatus === AccountStatus.PENDING_VERIFICATION || !user.emailVerified) {
        setUnverifiedEmail(user.email);
        setServerError('Your student email is not yet verified. Please verify your email to continue.');
        return;
      }

      if (user.accountStatus === AccountStatus.SUSPENDED) {
        setServerError('This student account is suspended. Please contact Apna Ghar Student Support.');
        return;
      }

      // STRICT ROLE VALIDATION:
      if (selectedRole === UserRole.STUDENT) {
        if (user.role === UserRole.STUDENT) {
          setAuth(user, res.accessToken);
          if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
            router.push(redirectUrl);
          } else {
            router.push('/student/dashboard');
          }
          return;
        }

        if (user.role === UserRole.ADMIN) {
          setAuth(user, res.accessToken);
          router.push(redirectUrl || '/admin/dashboard');
          return;
        }

        // If user is OWNER or MESS_PARTNER logging into Student tab:
        clearAuth();
        const isOwner = user.role === UserRole.OWNER;
        setRoleMismatch({
          detectedRole: user.role,
          roleTitle: isOwner ? 'House / Property Owner' : 'Food / Mess Partner',
          userEmail: user.email,
          portalUrl: isOwner ? '/owner/dashboard' : '/mess/dashboard',
          portalName: isOwner ? 'House Owner Portal' : 'Food Partner Portal',
        });
        return;
      }

      if (selectedRole === UserRole.OWNER) {
        if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
          setAuth(user, res.accessToken);
          if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
            router.push(redirectUrl);
          } else {
            router.push('/owner/dashboard');
          }
          return;
        }

        clearAuth();
        setServerError(`Role mismatch: Your account is registered as a ${user.role}. Please select the appropriate role tab.`);
        return;
      }

      if (selectedRole === UserRole.MESS_PARTNER) {
        if (user.role === UserRole.MESS_PARTNER || user.role === UserRole.ADMIN) {
          setAuth(user, res.accessToken);
          if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
            router.push(redirectUrl);
          } else {
            router.push('/mess/dashboard');
          }
          return;
        }

        clearAuth();
        setServerError(`Role mismatch: Your account is registered as a ${user.role}. Please select the appropriate role tab.`);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const message = err.message || 'Unable to sign in. Please verify your credentials.';
        if (message.toLowerCase().includes('verify') || message.toLowerCase().includes('verification')) {
          setUnverifiedEmail(data.email.trim().toLowerCase());
        }
        setServerError(message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('A network error occurred. Please check your connection and try again.');
      }
    }
  };

  return (
    <div className="w-full">
      {/* Three-Role Selection */}
      <div className="flex p-1 rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] mb-6">
        <button
          type="button"
          onClick={() => {
            setSelectedRole(UserRole.STUDENT);
            setRoleMismatch(null);
            setServerError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            selectedRole === UserRole.STUDENT
              ? 'bg-[#102B50] text-white shadow-sm'
              : 'text-[#687586] hover:text-[#102B50]'
          }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedRole(UserRole.OWNER);
            setRoleMismatch(null);
            setServerError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            selectedRole === UserRole.OWNER
              ? 'bg-[#102B50] text-white shadow-sm'
              : 'text-[#687586] hover:text-[#102B50]'
          }`}
        >
          Property Owner
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedRole(UserRole.MESS_PARTNER);
            setRoleMismatch(null);
            setServerError(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            selectedRole === UserRole.MESS_PARTNER
              ? 'bg-[#102B50] text-white shadow-sm'
              : 'text-[#687586] hover:text-[#102B50]'
          }`}
        >
          Mess Partner
        </button>
      </div>
      {/* Role Mismatch Alert */}
      {roleMismatch && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-brand-slate shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  Role Mismatch: Account Registered as {roleMismatch.roleTitle}
                </h4>
                <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                  This portal is exclusively designed for <strong>Students</strong> looking for verified rooms, PGs, and meal plans. Your account (<code className="font-semibold text-amber-950">{roleMismatch.userEmail}</code>) is registered under our partner program.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <Link
                  href={roleMismatch.portalUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#102B50] text-white hover:bg-[#183D68] transition-colors shadow-sm"
                >
                  <span>{roleMismatch.portalName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setRoleMismatch(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Server Error Alert */}
      {serverError && !roleMismatch && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 flex-1">
              <p className="font-semibold">{serverError}</p>
              {unverifiedEmail && (
                <div className="pt-1">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-700 underline hover:text-red-900"
                  >
                    Click here to complete student email verification &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="student-email"
            className="block text-xs font-semibold text-brand-slate mb-1.5"
          >
            {selectedRole === UserRole.STUDENT
              ? 'Student Email Address'
              : selectedRole === UserRole.OWNER
              ? 'Property Owner Email Address'
              : 'Mess Vendor Email Address'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="student-email"
              type="email"
              autoComplete="email"
              placeholder={
                selectedRole === UserRole.STUDENT
                  ? 'e.g. yourname@university.ac.in'
                  : selectedRole === UserRole.OWNER
                  ? 'e.g. owner@apnaghar.com'
                  : 'e.g. vendor@apnaghar.in'
              }
              disabled={isSubmitting}
              {...register('email')}
              className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border ${
                errors.email
                  ? 'border-red-400 focus:ring-red-300 focus:border-red-500 bg-red-50/20'
                  : 'border-[#E8E5DE] focus:border-[#102B50] focus:ring-[#102B50]/10 bg-white'
              } text-brand-slate placeholder:text-[#9AA2B1] focus:outline-none focus:ring-4 transition-all duration-150 disabled:bg-[#FAF8F3] disabled:cursor-not-allowed`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-[11px] font-medium text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="student-password"
              className="block text-xs font-semibold text-brand-slate"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-[#F5A623] hover:text-[#E99A12] transition-colors hover:underline focus:outline-none focus:ring-1 focus:ring-[#F5A623] rounded"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="student-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your secret password"
              disabled={isSubmitting}
              {...register('password')}
              className={`w-full pl-10 pr-11 py-2.5 text-xs rounded-xl border ${
                errors.password
                  ? 'border-red-400 focus:ring-red-300 focus:border-red-500 bg-red-50/20'
                  : 'border-[#E8E5DE] focus:border-[#102B50] focus:ring-[#102B50]/10 bg-white'
              } text-brand-slate placeholder:text-[#9AA2B1] focus:outline-none focus:ring-4 transition-all duration-150 disabled:bg-[#FAF8F3] disabled:cursor-not-allowed`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-muted hover:text-brand-slate transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-[11px] font-medium text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Options Row: Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('rememberMe')}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-[#E8E5DE] text-[#102B50] focus:ring-[#102B50]/20 transition-all cursor-pointer"
            />
            <span className="text-xs text-brand-slate font-medium">
              Remember my email on this device
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#183D68] active:scale-[0.99] transition-all shadow-brand-md disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
              <span>
                {isSlowNotice
                  ? 'Connecting to secure server...'
                  : selectedRole === UserRole.STUDENT
                  ? 'Signing into Student Portal...'
                  : selectedRole === UserRole.OWNER
                  ? 'Signing into Owner Portal...'
                  : 'Signing into Vendor Portal...'}
              </span>
            </>
          ) : (
            <>
              <span>
                {selectedRole === UserRole.STUDENT
                  ? 'Sign In to Student Portal'
                  : selectedRole === UserRole.OWNER
                  ? 'Sign In to Owner Portal'
                  : 'Sign In to Vendor Portal'}
              </span>
              <ArrowRight className="w-4 h-4 text-[#F5A623]" />
            </>
          )}
        </button>
      </form>

      {/* Registration & Other Roles */}
      <div className="mt-6 pt-5 border-t border-[#E8E5DE] space-y-3 text-center">
        <p className="text-xs text-brand-slate">
          New to Apna Ghar?{' '}
          <Link
            href="/register?role=STUDENT"
            className="font-bold text-[#F5A623] hover:text-[#E99A12] transition-colors hover:underline inline-flex items-center gap-1"
          >
            Create Student Account
            <ArrowRight className="w-3 h-3" />
          </Link>
        </p>

        {/* Subtle partner switch helper */}
        <div className="pt-2 text-[11px] text-brand-muted flex items-center justify-center gap-1.5 flex-wrap">
          <span>Are you a property owner or mess vendor?</span>
          <Link
            href="/owner/dashboard"
            className="text-brand-slate hover:text-[#102B50] font-semibold underline"
          >
            Owner Portal
          </Link>
          <span>•</span>
          <Link
            href="/mess/dashboard"
            className="text-brand-slate hover:text-[#102B50] font-semibold underline"
          >
            Vendor Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-brand-slate flex flex-col justify-between selection:bg-[#F5A623]/20">
      {/* Top Header Navigation */}
      <header className="w-full border-b border-[#E8E5DE]/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Back to Website */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-slate hover:text-[#102B50] transition-colors py-1 px-2.5 rounded-lg hover:bg-[#FAF8F3]"
          >
            <ArrowLeft className="w-4 h-4 text-[#F5A623]" />
            <span>Back to Apna Ghar Home</span>
          </Link>

          {/* Centered Brand Mark on Mobile, Right on Desktop */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#102B50] flex items-center justify-center text-[#F5A623] font-black text-sm shadow-brand-sm">
              AG
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-extrabold tracking-wide text-[#102B50] block leading-none">
                APNA GHAR
              </span>
              <span className="text-[9px] uppercase tracking-wider text-brand-muted font-medium">
                Har Shehar Apna Ghar
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: Student Login Form Card (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-white rounded-2xl border border-[#E8E5DE] shadow-brand-card p-6 sm:p-10">
              
              {/* Header Elements */}
              <div className="mb-6 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FAF8F3] border border-[#E8E5DE] text-[#102B50]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Student Portal Login</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102B50] tracking-tight">
                  Welcome Back
                </h1>
                
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Sign in to manage your room reservations, select beds, view verified meal plans, and track your campus stay.
                </p>
              </div>

              {/* Form Component inside Suspense boundary */}
              <Suspense
                fallback={
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#102B50]" />
                    <p className="text-xs text-brand-muted">Loading secure student login...</p>
                  </div>
                }
              >
                <StudentLoginForm />
              </Suspense>

            </div>

            {/* Mobile/Tablet Trust Highlights */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-brand-muted lg:hidden flex-wrap">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-Bit SSL Encrypted
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623]" />
                Zero Brokerage
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#102B50]" />
                100% Physically Verified
              </span>
            </div>
          </div>

          {/* Right Column: Branded Value Showcase (5 Cols, Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-[#102B50] via-[#14345B] to-[#0A1D36] text-white rounded-2xl p-8 sm:p-9 shadow-brand-lg relative overflow-hidden border border-[#183D68]">
            
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-[#183D68]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-sm border border-white/15 text-[#F5A623]">
                <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Verified Student Living</span>
              </div>

              {/* Showcase Title */}
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white leading-snug">
                  Finding your home away from home just got simple.
                </h2>
                <p className="mt-2 text-xs text-white/70 leading-relaxed">
                  Join thousands of university students booking verified hostels, PGs, and hygienic meals with zero hidden charges.
                </p>
              </div>

              {/* 4 Core Pillars */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#F5A623]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Zero Brokerage Guarantee</h3>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Connect directly with verified owners. No agents, no commission fees.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#F5A623]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">7-Point Physical Verification</h3>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Every property is physically inspected for security, hygiene, and amenities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#F5A623]">
                    <Bed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Real-Time Bed Selection</h3>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Choose your exact bed with temporary hold lock to prevent double-booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#F5A623]">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Verified Campus Meal Plans</h3>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Subscribe to healthy, homestyle student meals with flexible trial options.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proof Metrics */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-base font-black text-[#F5A623]">25+</span>
                  <span className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                    Campuses Covered
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-base font-black text-[#F5A623]">100%</span>
                  <span className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                    Verified Listings
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Platform Status: Active
                </span>
                <span className="font-semibold text-white/80">Har Shehar Apna Ghar</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="w-full border-t border-[#E8E5DE] py-4 bg-white/60 text-center text-[11px] text-brand-muted">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Apna Ghar Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-brand-slate transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-brand-slate transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-brand-slate transition-colors">
              Student Helpdesk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
