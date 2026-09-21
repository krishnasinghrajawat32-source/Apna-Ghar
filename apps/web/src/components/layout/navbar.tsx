'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@apnaghar/shared-types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/auth/auth-modal';
import {
  Home,
  Search,
  UtensilsCrossed,
  Layers,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, role, logout, demoLogin } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { href: '/search', label: 'Find Accommodations', icon: <Search className="w-4 h-4" /> },
    { href: '/food', label: 'Food & Mess', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { href: '/compare', label: 'Compare', icon: <Layers className="w-4 h-4" /> },
  ];

  const getDashboardLink = () => {
    switch (role) {
      case UserRole.STUDENT:
        return { href: '/student', label: 'Student Portal' };
      case UserRole.OWNER:
        return { href: '/owner', label: 'Owner Portal' };
      case UserRole.FOOD_PARTNER:
        return { href: '/food-partner', label: 'Kitchen Console' };
      case UserRole.ADMIN:
        return { href: '/admin', label: 'Admin Console' };
      default:
        return { href: '/', label: 'Dashboard' };
    }
  };

  const dashboardInfo = getDashboardLink();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              अ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">APNA GHAR</span>
                <span className="text-xs text-slate-400 hidden sm:inline font-normal font-sans">(अपना घर)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide -mt-0.5">
                Har Safar, Apna Ghar
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-slate-800/90 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40',
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth & User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition-all text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold">
                    {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-white">{user.firstName}</span>
                  <Badge variant={role?.toLowerCase() as any} size="sm">
                    {role}
                  </Badge>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-20 space-y-1">
                      <div className="px-3 py-2 border-b border-slate-800 text-xs">
                        <p className="font-semibold text-white truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                      </div>

                      <Link
                        href={dashboardInfo.href}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition"
                      >
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>{dashboardInfo.label}</span>
                      </Link>

                      {/* Quick Role Switcher (for convenience in review) */}
                      <div className="px-3 pt-2 pb-1 border-t border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                        Switch Role (Demo)
                      </div>
                      <div className="grid grid-cols-2 gap-1 px-1">
                        <button
                          onClick={() => {
                            demoLogin(UserRole.STUDENT);
                            setUserDropdownOpen(false);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-800/60 hover:bg-slate-800 text-indigo-400 text-left"
                        >
                          Student
                        </button>
                        <button
                          onClick={() => {
                            demoLogin(UserRole.OWNER);
                            setUserDropdownOpen(false);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-800/60 hover:bg-slate-800 text-amber-400 text-left"
                        >
                          Owner
                        </button>
                        <button
                          onClick={() => {
                            demoLogin(UserRole.FOOD_PARTNER);
                            setUserDropdownOpen(false);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-800/60 hover:bg-slate-800 text-emerald-400 text-left"
                        >
                          Kitchen
                        </button>
                        <button
                          onClick={() => {
                            demoLogin(UserRole.ADMIN);
                            setUserDropdownOpen(false);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-800/60 hover:bg-slate-800 text-purple-400 text-left"
                        >
                          Admin
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-800 mt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('login')}
                  className="text-xs"
                >
                  Sign In
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => openAuth('register')}
                  className="text-xs font-semibold"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs font-semibold text-white">{user.firstName}</span>
                    <Badge variant={role?.toLowerCase() as any} size="sm">
                      {role}
                    </Badge>
                  </div>
                  <Link
                    href={dashboardInfo.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-white"
                  >
                    {dashboardInfo.label}
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAuth('login')}
                    className="w-full text-xs"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => openAuth('register')}
                    className="w-full text-xs"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
};
