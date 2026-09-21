'use client';

import React from 'react';
import { ToastProvider } from '@/context/toast-context';
import { AuthProvider } from '@/context/auth-context';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
};
