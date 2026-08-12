import React, { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';

// ---------- Button ----------

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-agorange text-white hover:bg-agorange-600 shadow-sm',
  secondary: 'border-2 border-agdark-800 text-agdark-800 hover:bg-agdark-800 hover:text-white',
  dark: 'bg-agdark-800 text-white hover:bg-agdark-700',
  outline: 'border border-agdark-200 text-agdark-700 hover:border-agorange hover:text-agorange bg-white',
  ghost: 'text-agdark-600 hover:bg-agdark-100 hover:text-agdark-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agorange disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
});

// ---------- Form controls ----------

export interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label className="block text-sm font-medium text-agdark-700">
          {label}
          {required ? <span className="ml-0.5 text-agorange">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="text-xs text-agdark-400">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-agdark-200 bg-white px-3 text-sm text-agdark-800 placeholder:text-agdark-300 transition focus:border-agblue focus:outline-none focus:ring-2 focus:ring-agblue/20 disabled:bg-agdark-50',
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-agdark-200 bg-white px-3 py-2 text-sm text-agdark-800 placeholder:text-agdark-300 transition focus:border-agblue focus:outline-none focus:ring-2 focus:ring-agblue/20 disabled:bg-agdark-50',
          className
        )}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-agdark-200 bg-white px-3 text-sm text-agdark-800 transition focus:border-agblue focus:outline-none focus:ring-2 focus:ring-agblue/20 disabled:bg-agdark-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export function Checkbox({
  label,
  checked,
  onChange,
  className,
}: {
  label?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm text-agdark-700', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 rounded border-agdark-300 text-agorange focus:ring-agorange"
      />
      {label}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-agdark-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="pl-9"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-agdark-400 hover:bg-agdark-100 hover:text-agdark-700"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

// ---------- Surfaces ----------

export function Card({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-agdark-100 bg-white', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'orange',
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: 'orange' | 'blue' | 'green' | 'dark';
  hint?: string;
}) {
  const accents: Record<string, string> = {
    orange: 'bg-agorange-50 text-agorange',
    blue: 'bg-agblue-50 text-agblue',
    green: 'bg-emerald-50 text-emerald-600',
    dark: 'bg-agdark-800 text-white',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-agdark-500">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-agdark-800">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-agdark-400">{hint}</p> : null}
        </div>
        {icon ? <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', accents[accent])}>{icon}</div> : null}
      </div>
    </Card>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: string; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700',
    orange: 'bg-agorange-50 text-agorange-700',
    blue: 'bg-agblue-50 text-agblue-700',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-800',
    dark: 'bg-agdark-800 text-white',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', tones[tone] ?? tones.neutral, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const toneMap: Record<string, string> = {
    Pending: 'amber',
    Submitted: 'amber',
    'In Progress': 'blue',
    Resolved: 'green',
    Confirmed: 'blue',
    Completed: 'green',
    Cancelled: 'red',
    Rejected: 'red',
    Draft: 'neutral',
    Approved: 'blue',
    Converted: 'green',
    Published: 'green',
    Active: 'green',
    Inactive: 'neutral',
    Ongoing: 'blue',
    Upcoming: 'amber',
    Archived: 'neutral',
  };
  return <Badge tone={toneMap[status] ?? 'neutral'}>{status}</Badge>;
}

// ---------- Feedback ----------

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-agorange', className)} />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-agdark-100 border-t-agorange" />
      <p className="text-sm text-agdark-500">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-agdark-100', className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-agdark-200 bg-agdark-50/50 px-6 py-14 text-center', className)}>
      {icon ? <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-agdark-400 shadow-sm">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-agdark-800">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-agdark-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

// ---------- Modal / Drawer ----------

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-agdark-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl', sizes[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-agdark-100 px-6 py-4">
          <div>
            {title ? <h2 className="font-display text-xl font-bold text-agdark-800">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-agdark-500">{description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-3 border-t border-agdark-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  danger = true,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-agdark-600">{message}</p>
    </Modal>
  );
}

// ---------- Tabs ----------

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ key: string; label: React.ReactNode; count?: number }>;
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1 border-b border-agdark-100', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition',
            active === tab.key
              ? 'border-agorange text-agorange'
              : 'border-transparent text-agdark-500 hover:text-agdark-800'
          )}
        >
          {tab.label}
          {tab.count != null ? (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active === tab.key ? 'bg-agorange-50 text-agorange' : 'bg-agdark-100 text-agdark-500')}>
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

// ---------- Table ----------

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-agdark-100', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-agdark-50 text-xs uppercase tracking-wide text-agdark-500">{children}</thead>;
}

export function TH({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 font-semibold', className)}>{children}</th>;
}

export function TR({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr onClick={onClick} className={cn('border-t border-agdark-100 transition hover:bg-agdark-50/60', onClick && 'cursor-pointer', className)}>
      {children}
    </tr>
  );
}

export function TD({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-agdark-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

// ---------- Progress ----------

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-agdark-100', className)}>
      <div className="h-full rounded-full bg-agorange transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ---------- Misc ----------

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-agblue-100 font-display font-bold text-agblue"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || '?'}
    </span>
  );
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: string; label: React.ReactNode }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-lg border border-agdark-200 bg-agdark-50 p-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-semibold transition',
            value === opt.value ? 'bg-white text-agorange shadow-sm' : 'text-agdark-500 hover:text-agdark-800'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-agorange">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-agdark-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
