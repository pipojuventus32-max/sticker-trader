import type { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-[max(1rem,var(--safe-bottom))] pt-4 sm:px-4 sm:pb-6 sm:pt-8 md:py-10">
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-strong rounded-2xl ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
      <div className="mb-3 h-1 w-14 rounded-full bg-gradient-to-r from-[#e30613] via-[#ffd700] to-[#2563eb]" />
      <div className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{title}</div>
      {subtitle ? (
        <div className="mt-2 text-xs leading-snug text-slate-600 sm:text-sm sm:leading-normal">{subtitle}</div>
      ) : null}
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />;
}

export function Button({
  children,
  variant = 'primary',
  selected = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  selected?: boolean;
}) {
  const base =
    'focus-ring inline-flex min-h-11 min-w-[44px] touch-manipulation items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold backdrop-blur-md transition active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed sm:active:scale-100 sm:active:translate-y-px';

  const styles: Record<string, string> = {
    primary:
      'border-2 border-[#f5d000] bg-gradient-to-b from-[#fff566] to-[#ffd700] text-slate-900 shadow-[0_4px_16px_rgba(255,215,0,0.45)] hover:from-[#fff989] hover:to-[#ffe433] active:from-[#ffd700] active:to-[#eab308]',
    secondary: selected
      ? 'border-[#1e3a8a] bg-gradient-to-b from-[#1e40af] to-[#1e3a8a] text-white shadow-[0_4px_18px_rgba(30,58,138,0.45)] hover:from-[#2563eb] hover:to-[#1e40af]'
      : 'border-[#1d4ed8] bg-[#2563eb] text-white shadow-[0_4px_18px_rgba(37,99,235,0.4)] hover:bg-[#1d4ed8] active:bg-[#1e40af]',
    danger: selected
      ? 'border-[#7f1d1d] bg-gradient-to-b from-[#991b1b] to-[#7f1d1d] text-white shadow-[0_4px_18px_rgba(127,29,29,0.45)] hover:from-[#b91c1c] hover:to-[#991b1b]'
      : 'border-[#b5050f] bg-[#e30613] text-white shadow-[0_4px_18px_rgba(227,6,19,0.4)] hover:bg-[#c50512] active:bg-[#a5040d]',
    ghost: selected
      ? 'border-slate-300 bg-slate-200 text-slate-900 hover:bg-slate-300'
      : 'border-slate-300/80 bg-white/70 text-slate-800 hover:bg-white active:bg-slate-100',
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
      <div className="mb-2 text-sm font-bold text-slate-800">{label}</div>
      <input
        className="focus-ring w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 shadow-inner shadow-slate-200/80 placeholder:text-slate-400 sm:py-2.5 sm:text-sm"
        {...props}
      />
    </label>
  );
}

export function Pill({
  active,
  tone = 'default',
  children,
  onClick,
  className = '',
}: {
  active?: boolean;
  /** When active, use blue for doubles-style filters. */
  tone?: 'default' | 'blue';
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const activeStyles =
    tone === 'blue' && active
      ? 'border-2 border-[#1e3a8a] bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)]'
      : active
        ? 'border-2 border-slate-800 bg-slate-900 text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)]'
        : 'border-2 border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring min-h-11 w-full touch-manipulation rounded-full px-4 py-2.5 text-sm font-bold tracking-tight transition active:scale-[0.97] sm:w-auto sm:px-5 sm:active:scale-100 ${activeStyles} ${className}`}
    >
      {children}
    </button>
  );
}
