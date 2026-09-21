'use client';

import React, { useState } from 'react';
import { UserRole } from '@apnaghar/shared-types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { Mail, Lock, User, Phone, Sparkles } from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [formError, setFormError] = useState<string | null>(null);

  const { login, register, demoLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole: UserRole) => {
    setDemoLoading(demoRole);
    setFormError(null);
    try {
      await demoLogin(demoRole);
      onClose();
    } catch (err: any) {
      setFormError(`Demo account for ${demoRole} unavailable or seed required.`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-extrabold text-xl">APNA GHAR</span>
          <span className="text-slate-500 text-sm font-normal">• {mode === 'login' ? 'Welcome Back' : 'Join Us'}</span>
        </div>
      }
      description={
        mode === 'login'
          ? 'Sign in to access student bookings, room inventory, or meal plans.'
          : 'Create your Apna Ghar account to discover rooms and meals.'
      }
    >
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setFormError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setFormError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Register Account
        </button>
      </div>

      {formError && (
        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {formError}
        </div>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="student@university.edu or you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" variant="emerald" className="w-full mt-2" isLoading={loading}>
            Sign In to Apna Ghar
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="e.g. Aryan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Sharma"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="aryan@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone (Optional)"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Select
              label="I Am A..."
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: UserRole.STUDENT, label: 'Student / Resident' },
                { value: UserRole.OWNER, label: 'Property Owner / PG Manager' },
                { value: UserRole.FOOD_PARTNER, label: 'Food Partner / Tiffin Service' },
              ]}
            />
          </div>

          <Input
            label="Password (min. 8 characters)"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" variant="emerald" className="w-full mt-2" isLoading={loading}>
            Create Account
          </Button>
        </form>
      )}

      {/* Demo Credentials Helper Section */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Demo 1-Click Login
          </span>
          <span className="text-[10px] text-slate-500">Seed Accounts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoClick(UserRole.STUDENT)}
            isLoading={demoLoading === UserRole.STUDENT}
            className="text-[11px] border-indigo-500/30 hover:border-indigo-500/60 hover:text-indigo-400"
          >
            Student
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoClick(UserRole.OWNER)}
            isLoading={demoLoading === UserRole.OWNER}
            className="text-[11px] border-amber-500/30 hover:border-amber-500/60 hover:text-amber-400"
          >
            Owner
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoClick(UserRole.FOOD_PARTNER)}
            isLoading={demoLoading === UserRole.FOOD_PARTNER}
            className="text-[11px] border-emerald-500/30 hover:border-emerald-500/60 hover:text-emerald-400"
          >
            Kitchen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDemoClick(UserRole.ADMIN)}
            isLoading={demoLoading === UserRole.ADMIN}
            className="text-[11px] border-purple-500/30 hover:border-purple-500/60 hover:text-purple-400"
          >
            Admin
          </Button>
        </div>
      </div>
    </Modal>
  );
};
