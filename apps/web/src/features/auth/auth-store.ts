'use client';

import { create } from 'zustand';
import { User } from '@apna-ghar/shared-types';
import { apiClient } from '@/lib/api-client';

const TOKEN_KEY = 'apna_ghar_access_token';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  fetchMe: () => Promise<User | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user: User, accessToken: string) => {
    if (typeof window !== 'undefined' && accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    }
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const localToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      const res = await apiClient<{ user: User; profile: unknown }>('/auth/me');
      const resolvedUser = (res as any)?.user || (res as any)?.data?.user || res;

      set({
        user: resolvedUser,
        accessToken: localToken,
        isAuthenticated: !!resolvedUser,
        isLoading: false,
      });
      return resolvedUser;
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },

  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failures on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
