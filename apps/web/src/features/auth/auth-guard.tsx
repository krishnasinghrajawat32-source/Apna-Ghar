'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@apna-ghar/shared-types';
import { useAuthStore } from './auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate home according to role
        if (user.role === UserRole.OWNER) {
          router.replace('/owner/dashboard');
        } else if (user.role === UserRole.MESS_PARTNER) {
          router.replace('/mess/dashboard');
        } else {
          router.replace('/');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#173327] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#3D3A33] font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
