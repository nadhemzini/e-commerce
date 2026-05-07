'use client';
import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type Toast } from '@/store/useToastStore';
import { cn } from '@/lib/utils';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success dark:text-success-dark shrink-0" />,
  error: <XCircle className="w-5 h-5 text-error dark:text-error-dark shrink-0" />,
  info: <Info className="w-5 h-5 text-accent dark:text-accent-dark shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
};

const barColors = {
  success: 'bg-success dark:bg-success-dark',
  error: 'bg-error dark:bg-error-dark',
  info: 'bg-accent dark:bg-accent-dark',
  warning: 'bg-amber-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.classList.add('animate-slide-up');
  }, []);

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 p-4 pr-10 rounded-xl shadow-lg min-w-[300px] max-w-sm',
        'bg-white dark:bg-slate-800 border border-[var(--border)]',
        'overflow-hidden'
      )}
    >
      {/* Progress bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-0.5 animate-[shrink_4s_linear_forwards]',
          barColors[toast.type]
        )}
        style={{ width: '100%', animation: toast.duration ? `shrink ${toast.duration}ms linear forwards` : undefined }}
      />
      {icons[toast.type]}
      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug flex-1">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                   transition-colors duration-150"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
