import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'emerald'
    | 'warning'
    | 'danger'
    | 'info'
    | 'student'
    | 'owner'
    | 'food_partner'
    | 'admin'
    | 'verified';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full border transition-colors select-none';

  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    student: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-semibold',
    owner: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    food_partner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold',
    verified:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold shadow-sm shadow-emerald-500/10',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {variant === 'verified' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
      {children}
    </span>
  );
};
