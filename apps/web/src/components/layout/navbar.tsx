'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Menu, X, ShieldCheck, Home, Utensils, Calendar, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { UserRole } from '@apna-ghar/shared-types';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchMe, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Find Stays', href: '/search', icon: ShieldCheck },
    { label: 'Mess Plans', href: '/mess', icon: Utensils },
    { label: 'My Visits', href: '/student/visits', icon: Calendar },
    { label: 'My Bookings', href: '/student/bookings', icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E8E5DE] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#102B50] flex items-center justify-center text-[#F5A623] font-black text-xl shadow-md transition-transform group-hover:scale-105">
            AG
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-[#102B50] leading-tight">
              APNA GHAR
            </span>
            <span className="text-[10px] text-[#F5A623] font-bold tracking-wider uppercase">
              Har Sahar Apna Ghar
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#263445]">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 transition-colors duration-150 ${
                  active
                    ? 'text-[#102B50] font-bold'
                    : 'text-[#687586] hover:text-[#102B50]'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F5A623] rounded-full" />
                )}
              </Link>
            );
          })}

          {user?.role === UserRole.ADMIN && (
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold text-[#F5A623] hover:text-[#E99A12] transition-colors"
            >
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-24 h-9 bg-[#E8E5DE]/60 animate-pulse rounded-xl" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={getDashboardHref(user.role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F3] hover:bg-[#F0F4F8] hover:border-[#102B50]/30 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[#102B50] text-[#FFFFFF] flex items-center justify-center text-xs font-bold shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#102B50] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#F5A623] font-semibold">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-[#687586] hover:text-[#D64545] hover:bg-[#D64545]/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold px-3.5 py-2 text-[#102B50] hover:bg-[#F0F4F8] rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-bold px-4 py-2 bg-[#F5A623] text-[#102B50] hover:bg-[#E99A12] rounded-xl shadow-sm transition-all hover:shadow"
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#263445] hover:bg-[#F0F4F8] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E5DE] bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#102B50] text-[#FFFFFF]'
                    : 'text-[#263445] hover:bg-[#FAF8F3]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#F5A623]' : 'text-[#687586]'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {user?.role === UserRole.ADMIN && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#F5A623] hover:bg-[#FAF8F3]"
            >
              <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Quick mobile auth links if not authenticated */}
          {!isAuthenticated && !isLoading && (
            <div className="pt-2 border-t border-[#E8E5DE] flex gap-2">
              <Link
                href="/login"
                className="flex-1 text-center py-2 text-xs font-semibold rounded-xl border border-[#E8E5DE] text-[#102B50]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center py-2 text-xs font-bold rounded-xl bg-[#F5A623] text-[#102B50]"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
