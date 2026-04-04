import type { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="text-xl font-semibold tracking-tight">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-white/70">{subtitle}</div> : null}
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-white/10" />;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const base =
    'focus-ring inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed';

  const styles: Record<string, string> = {
    primary:
      'bg-white/15 hover:bg-white/20 border border-white/15 text-white shadow-[0_10px_30px_rgba(0,0,0,0.30)]',
    secondary: 'bg-sky-500/15 hover:bg-sky-500/20 border border-sky-400/25 text-white',
    danger: 'bg-rose-500/15 hover:bg-rose-500/20 border border-rose-400/25 text-white',
    ghost: 'bg-transparent hover:bg-white/10 border border-transparent text-white/90',
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-white/80">{label}</div>
      <input
        className="focus-ring w-full rounded-xl border border-white/15 bg-white/8 px-3.5 py-2.5 text-sm text-white placeholder:text-white/45"
        {...props}
      />
    </label>
  );
}

export function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-emerald-500/20 border border-emerald-400/30 text-white'
          : 'bg-white/8 border border-white/12 text-white/85 hover:bg-white/12'
      }`}
    >
      {children}
    </button>
  );
}

