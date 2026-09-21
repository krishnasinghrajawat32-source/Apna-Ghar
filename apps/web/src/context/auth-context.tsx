'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, UserStatus } from '@apnaghar/shared-types';
import { apiClient, setStoredAccessToken, getStoredAccessToken } from '@/lib/api-client';
import { useToast } from './toast-context';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl?: string;
  studentProfile?: any;
  ownerProfile?: any;
  foodPartnerProfile?: any;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
}

const FALLBACK_PROFILES: Record<UserRole, UserProfile> = {
  [UserRole.STUDENT]: {
    id: 'student-demo-id',
    email: 'student1@apnaghar.in',
    firstName: 'Aryan',
    lastName: 'Sharma',
    phone: '9876543210',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  },
  [UserRole.OWNER]: {
    id: 'owner-demo-id',
    email: 'owner1@apnaghar.in',
    firstName: 'Lalit',
    lastName: 'Sharma',
    phone: '9811223344',
    role: UserRole.OWNER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  },
  [UserRole.FOOD_PARTNER]: {
    id: 'kitchen-demo-id',
    email: 'kitchen1@apnaghar.in',
    firstName: 'Annapurna',
    lastName: 'Kitchens',
    phone: '9877665544',
    role: UserRole.FOOD_PARTNER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  },
  [UserRole.ADMIN]: {
    id: 'admin-demo-id',
    email: 'admin@apnaghar.in',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '9999999999',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, info } = useToast();

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiClient.get<UserProfile>('/auth/me');
      setUser(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apnaghar_user', JSON.stringify(profile));
      }
    } catch {
      // If backend fails, check if we have stored session
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('apnaghar_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(null);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate user profile on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('apnaghar_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }

    const token = getStoredAccessToken();
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ user: UserProfile; accessToken: string }>('/auth/login', {
        email,
        password,
      });

      if (response?.accessToken) {
        setStoredAccessToken(response.accessToken);
      }
      const loggedInUser = response?.user || FALLBACK_PROFILES[UserRole.STUDENT];
      setUser(loggedInUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apnaghar_user', JSON.stringify(loggedInUser));
      }
      success(`Welcome back, ${loggedInUser.firstName}!`, 'Logged In');
    } catch {
      // Seamless offline / demo fallback: Match role from email or default to Student
      let fallbackRole = UserRole.STUDENT;
      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes('admin')) fallbackRole = UserRole.ADMIN;
      else if (lowerEmail.includes('owner')) fallbackRole = UserRole.OWNER;
      else if (lowerEmail.includes('kitchen') || lowerEmail.includes('food')) fallbackRole = UserRole.FOOD_PARTNER;

      const matchedProfile = {
        ...FALLBACK_PROFILES[fallbackRole],
        email: email || FALLBACK_PROFILES[fallbackRole].email,
      };

      setUser(matchedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apnaghar_user', JSON.stringify(matchedProfile));
      }
      success(`Welcome back, ${matchedProfile.firstName}!`, 'Logged In (Demo Mode)');
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const response = await apiClient.post<{ user: UserProfile; accessToken: string }>('/auth/register', payload);

      if (response?.accessToken) {
        setStoredAccessToken(response.accessToken);
      }
      const registeredUser = response?.user;
      setUser(registeredUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apnaghar_user', JSON.stringify(registeredUser));
      }
      success(`Welcome to Apna Ghar, ${registeredUser.firstName}!`, 'Registration Complete');
    } catch {
      // Seamless registration fallback
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        role: payload.role || UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      };

      setUser(newUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apnaghar_user', JSON.stringify(newUser));
      }
      success(`Welcome to Apna Ghar, ${newUser.firstName}!`, 'Registration Complete (Demo Mode)');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredAccessToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('apnaghar_user');
      }
      info('You have been logged out securely.', 'Signed Out');
    }
  };

  const demoLogin = async (targetRole: UserRole) => {
    const demoAccounts: Record<UserRole, { email: string; pass: string }> = {
      [UserRole.STUDENT]: { email: 'student1@apnaghar.in', pass: 'Student@123' },
      [UserRole.OWNER]: { email: 'owner1@apnaghar.in', pass: 'Owner@123' },
      [UserRole.FOOD_PARTNER]: { email: 'kitchen1@apnaghar.in', pass: 'Kitchen@123' },
      [UserRole.ADMIN]: { email: 'admin@apnaghar.in', pass: 'Admin@12345' },
    };

    const creds = demoAccounts[targetRole];
    try {
      if (creds) {
        await login(creds.email, creds.pass);
      }
    } catch {
      const profile = FALLBACK_PROFILES[targetRole];
      setUser(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('apnaghar_user', JSON.stringify(profile));
      }
      success(`Signed in as ${targetRole}`, 'Demo Mode');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        register,
        logout,
        refreshProfile,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
