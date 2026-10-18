'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { UserRole } from '@apna-ghar/shared-types';

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return 'Student';
      case UserRole.OWNER:
        return 'Property Owner';
      case UserRole.MESS_PARTNER:
        return 'Mess Partner';
      case UserRole.ADMIN:
        return 'Admin';
      default:
        return role;
    }
  };

  const getDashboardHref = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return '/student/dashboard';
      case UserRole.OWNER:
        return '/owner/dashboard';
      case UserRole.MESS_PARTNER:
        return '/mess/dashboard';
      case UserRole.ADMIN:
        return '/admin/verifications';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FCFBF7]/90 backdrop-blur-md border-b border-[#ECE8DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            AG
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#173327] leading-tight">
              APNA GHAR
            </span>
            <span className="text-[10px] text-[#E06D3B] font-medium tracking-wide">
              Har Sahar Apna Ghar
            </span>
          </div>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#3D3A33]">
          <Link href="/" className="hover:text-[#173327] transition-colors">
            Home
          </Link>
          <span className="text-[#DDD7C7]">•</span>
          <Link href="/search" className="hover:text-[#173327] transition-colors">
            Find Stays
          </Link>
          <span className="text-[#DDD7C7]">•</span>
          <Link href="/student/visits" className="hover:text-[#173327] transition-colors">
            My Visits
          </Link>
          <span className="text-[#DDD7C7]">•</span>
          <Link href="/student/bookings" className="hover:text-[#173327] transition-colors">
            My Bookings
          </Link>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-20 h-8 bg-[#ECE8DD] animate-pulse rounded-md" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardHref(user.role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#ECE8DD] bg-white hover:bg-[#F7F5EE] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#DCE8E2] text-[#173327] flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#173327] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#E06D3B] font-medium">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-[#3D3A33] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 text-[#173327] hover:bg-[#ECE8DD] rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold px-3.5 py-1.5 bg-[#173327] text-white hover:bg-[#1F4333] rounded-lg shadow-sm transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
