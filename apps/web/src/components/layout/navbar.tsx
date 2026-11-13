'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LogOut,
  Menu,
  X,
  Home,
  ShieldCheck,
  Utensils,
  Calendar,
  BookOpen,
  MessageCircle,
  User,
  LayoutDashboard,
  Building2,
  PlusCircle,
  Wallet,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  Users,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { UserRole } from '@apna-ghar/shared-types';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
}

// 1. STUDENT NAVBAR (Exact 6 items in exact sequence)
export const STUDENT_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Find Stays', href: '/search', icon: ShieldCheck },
  { label: 'Mess Plans', href: '/mess', icon: Utensils },
  { label: 'My Visits', href: '/student/visits', icon: Calendar },
  { label: 'My Bookings', href: '/student/bookings', icon: BookOpen },
  { label: 'Profile', href: '/student/dashboard', icon: User },
];

// 2. HOUSE OWNER NAVBAR (Exact 7 items in exact sequence)
export const OWNER_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'My Properties', href: '/owner/dashboard?tab=properties', icon: Building2 },
  { label: 'Add Property', href: '/owner/dashboard?tab=add-property', icon: PlusCircle },
  { label: 'Visit Requests', href: '/owner/dashboard?tab=visits', icon: Calendar },
  { label: 'Bookings', href: '/owner/dashboard?tab=bookings', icon: BookOpen },
  { label: 'Earnings', href: '/owner/dashboard?tab=earnings', icon: Wallet },
  { label: 'Profile', href: '/owner/dashboard?tab=profile', icon: User },
];

// 3. FOOD VENDOR NAVBAR (Exact 9 items in exact sequence)
export const VENDOR_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/mess/dashboard', icon: LayoutDashboard },
  { label: 'My Outlet', href: '/mess/dashboard?tab=outlet', icon: Store },
  { label: 'Menu Management', href: '/mess/dashboard?tab=menu', icon: UtensilsCrossed },
  { label: 'Meal Plans', href: '/mess/dashboard?tab=plans', icon: Utensils },
  { label: 'Orders', href: '/mess/dashboard?tab=subscriptions', icon: ShoppingBag },
  { label: 'QR Meal Pass', href: '/mess/dashboard?tab=qr', icon: QrCode },
  { label: 'Customers', href: '/mess/dashboard?tab=customers', icon: Users },
  { label: 'Earnings', href: '/mess/dashboard?tab=earnings', icon: Wallet },
  { label: 'Profile', href: '/mess/dashboard?tab=profile', icon: User },
];

// 4. LOGGED-OUT VISITOR NAVBAR (Exact 5 items in exact sequence)
export const PUBLIC_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Find Stays', href: '/search', icon: ShieldCheck },
  { label: 'Mess Plans', href: '/mess', icon: Utensils },
  { label: 'Sign In', href: '/login', icon: LogIn },
  { label: 'Create Account', href: '/register', icon: UserPlus },
];

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, fetchMe, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    setIsDarkTheme(document.documentElement.dataset.theme === 'dark');
  }, []);

  // Close mobile drawer on route or tab change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/login');
  };

<<<<<<< HEAD
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
    ...(user?.role === UserRole.STUDENT
      ? [{ label: 'Messages', href: '/student/messages', icon: MessageCircle }]
      : []),
    ...(user?.role === UserRole.OWNER
      ? [{ label: 'Owner Inbox', href: '/owner/inbox', icon: MessageCircle }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

=======
>>>>>>> edee983 (feat: implement role-based dynamic navbar and student login with dashboard tab sync)
  const toggleTheme = () => {
    const nextTheme = isDarkTheme ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('apna-ghar-theme', nextTheme);
    setIsDarkTheme(nextTheme === 'dark');
  };

  // Determine active navigation state based strictly on authenticated role
  const isStudent = isAuthenticated && user && user.role === UserRole.STUDENT;
  const isOwner = isAuthenticated && user && user.role === UserRole.OWNER;
  const isVendor =
    isAuthenticated &&
    user &&
    (user.role === UserRole.MESS_PARTNER || (user.role as any) === 'VENDOR');
  const isAdmin = isAuthenticated && user && user.role === UserRole.ADMIN;

  let currentNavItems: NavItemConfig[];
  let currentRoleBadge = '';

  if (isStudent) {
    currentNavItems = STUDENT_NAV_ITEMS;
    currentRoleBadge = 'Student';
  } else if (isOwner) {
    currentNavItems = OWNER_NAV_ITEMS;
    currentRoleBadge = 'House Owner';
  } else if (isVendor) {
    currentNavItems = VENDOR_NAV_ITEMS;
    currentRoleBadge = 'Food Vendor';
  } else if (isAdmin) {
    // Admin inherits student links plus direct access
    currentNavItems = STUDENT_NAV_ITEMS;
    currentRoleBadge = 'Admin';
  } else {
    currentNavItems = PUBLIC_NAV_ITEMS;
  }

  // Precision active matching including query tabs (e.g. ?tab=properties)
  const isItemActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      const params = new URLSearchParams(query);
      const targetTab = params.get('tab');
      const currentTab = searchParams?.get('tab');
      if (targetTab && currentTab) {
        return targetTab === currentTab;
      }
      return false;
    }

    if (href === '/') {
      return pathname === '/';
    }

    // Dashboard root matching when no tab query is present
    if (href === '/owner/dashboard') {
      const currentTab = searchParams?.get('tab');
      return (
        pathname === '/owner/dashboard' &&
        (!currentTab || currentTab === 'overview' || currentTab === 'properties')
      );
    }

    if (href === '/mess/dashboard') {
      const currentTab = searchParams?.get('tab');
      return (
        pathname === '/mess/dashboard' &&
        (!currentTab || currentTab === 'overview')
      );
    }

    if (href === '/search') {
      return pathname === '/search' || pathname.startsWith('/property/');
    }

    if (href === '/mess') {
      return pathname === '/mess' || (pathname.startsWith('/mess/') && !pathname.startsWith('/mess/dashboard'));
    }

    if (href === '/login') {
      return pathname === '/login';
    }

    if (href === '/register') {
      return pathname === '/register';
    }

    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E8E5DE] shadow-brand-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-[#102B50] flex items-center justify-center text-[#F5A623] font-black text-xl shadow-brand-sm transition-transform group-hover:scale-105">
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

        {/* Desktop Horizontal Navigation */}
        <nav
          className="hidden md:flex items-center gap-4 lg:gap-6 text-xs font-semibold text-[#263445] overflow-x-auto py-1 scrollbar-none"
          aria-label="Main Navigation"
        >
          {isLoading ? (
            /* Loading Skeleton prevents flashing the wrong role navbar */
            <div className="flex items-center gap-5">
              <div className="w-14 h-4 bg-[#E8E5DE]/70 rounded animate-pulse" />
              <div className="w-20 h-4 bg-[#E8E5DE]/70 rounded animate-pulse" />
              <div className="w-20 h-4 bg-[#E8E5DE]/70 rounded animate-pulse" />
              <div className="w-16 h-4 bg-[#E8E5DE]/70 rounded animate-pulse" />
            </div>
          ) : !isAuthenticated ? (
            /* Logged-Out Visitor Navbar: Items 1, 2, 3 in exact order */
            PUBLIC_NAV_ITEMS.slice(0, 3).map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative py-1.5 flex items-center gap-1.5 whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? 'text-[#102B50] font-bold'
                      : 'text-[#687586] hover:text-[#102B50]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F5A623]' : 'text-[#687586]'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F5A623] rounded-full" />
                  )}
                </Link>
              );
            })
          ) : (
            /* Role-Specific Navbars (Student, House Owner, Food Vendor) in Exact Sequence */
            currentNavItems.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative py-1.5 flex items-center gap-1.5 whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? 'text-[#102B50] font-bold'
                      : 'text-[#687586] hover:text-[#102B50]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F5A623]' : 'text-[#687586]'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F5A623] rounded-full" />
                  )}
                </Link>
              );
            })
          )}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold text-[#F5A623] hover:text-[#E99A12] transition-colors whitespace-nowrap"
            >
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right Actions: Theme Toggle, Auth Buttons, or User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Theme Toggle Button */}
          <button
            type="button"
            role="switch"
            onClick={toggleTheme}
            aria-checked={isDarkTheme}
            aria-label={isDarkTheme ? 'Dark theme' : 'Light theme'}
            title="Toggle theme"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#E8E5DE] px-2.5 py-1.5 text-[10px] font-bold text-[#263445] transition-colors hover:bg-[#F0F4F8]"
          >
            <span>{isDarkTheme ? 'Dark' : 'Light'}</span>
            <span
              aria-hidden="true"
              className={`flex h-5 w-8 items-center rounded-full p-0.5 transition-colors ${
                isDarkTheme ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#102B50] shadow-sm transition-transform ${
                  isDarkTheme ? 'translate-x-3' : 'translate-x-0'
                }`}
              >
                {isDarkTheme ? <Moon className="h-2.5 w-2.5" /> : <Sun className="h-2.5 w-2.5" />}
              </span>
            </span>
          </button>

          {isLoading ? (
            <div className="w-24 h-9 bg-[#E8E5DE]/60 animate-pulse rounded-xl" />
          ) : !isAuthenticated ? (
            /* Logged-Out Visitor Navbar: Items 4 & 5 (Sign In, Create Account) in exact order */
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                  isItemActive('/login')
                    ? 'bg-[#102B50] text-white'
                    : 'text-[#102B50] hover:bg-[#F0F4F8]'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`text-xs font-bold px-4 py-2 rounded-xl shadow-brand-sm transition-all ${
                  isItemActive('/register')
                    ? 'bg-[#E99A12] text-[#102B50]'
                    : 'bg-[#F5A623] text-[#102B50] hover:bg-[#E99A12]'
                }`}
              >
                Create Account
              </Link>
            </div>
          ) : user ? (
            /* Authenticated User Badge & Logout Action */
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-[#E8E5DE] bg-[#FAF8F3]"
                title={`Signed in as ${user.name} (${currentRoleBadge})`}
              >
                <div className="w-7 h-7 rounded-lg bg-[#102B50] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#102B50] leading-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#F5A623] font-semibold leading-tight">
                    {currentRoleBadge}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="p-2 text-[#687586] hover:text-[#D64545] hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#263445] hover:bg-[#F0F4F8] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Responsive Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E5DE] bg-white px-4 pt-3 pb-6 space-y-2 shadow-brand-lg animate-in fade-in slide-in-from-top-2">
          
          {/* User Status Bar if Logged In */}
          {isAuthenticated && user && (
            <div className="p-3 mb-2 rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#102B50] text-white flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#102B50]">{user.name}</p>
                  <p className="text-[10px] text-[#F5A623] font-semibold">{currentRoleBadge}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
          )}

          {/* Exact Navigation Items in Exact Sequence */}
          {currentNavItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#102B50] text-white'
                    : 'text-[#263445] hover:bg-[#FAF8F3]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#F5A623]' : 'text-[#687586]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#F5A623] hover:bg-[#FAF8F3]"
            >
              <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Mobile Logout Action for Authenticated Users */}
          {isAuthenticated && (
            <div className="pt-3 mt-2 border-t border-[#E8E5DE]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E8E5DE] h-16 shadow-brand-sm flex items-center px-4 sm:px-8 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#102B50] flex items-center justify-center text-[#F5A623] font-black text-xl">
              AG
            </div>
            <span className="text-base font-extrabold text-[#102B50]">APNA GHAR</span>
          </div>
          <div className="w-24 h-8 bg-[#E8E5DE]/60 rounded-xl animate-pulse" />
        </header>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
