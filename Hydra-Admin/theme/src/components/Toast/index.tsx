"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClick?: () => void;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    Icon: CircleCheck,
    color: 'text-emerald-500',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow:   'shadow-emerald-500/10',
  },
  error: {
    Icon: CircleX,
    color: 'text-red-500',
    bg:     'bg-red-500/10',
    border: 'border-red-500/20',
    glow:   'shadow-red-500/10',
  },
  info: {
    Icon: Info,
    color: 'text-primary',
    bg:     'bg-primary/10',
    border: 'border-primary/20',
    glow:   'shadow-primary/10',
  },
  warning: {
    Icon: TriangleAlert,
    color: 'text-amber-500',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow:   'shadow-amber-500/10',
  },
} as const;

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const { Icon, color, bg, border, glow } = toastConfig[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(toast.id), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, toast.id, onClose]);

  return (
    <div
      className={[
        'relative group flex items-center gap-4 p-4 pr-5 rounded-2xl',
        'border bg-surface/80 backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]',
        'min-w-[320px] max-w-sm overflow-hidden',
        border,
        glow,
        toast.onClick ? 'cursor-pointer hover:bg-surface/90 transition-all' : '',
      ].join(' ')}
      {...(toast.onClick ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => {
          toast.onClick?.();
          onClose(toast.id);
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toast.onClick?.();
            onClose(toast.id);
          }
        }
      } : {
        role: 'alert',
        'aria-live': 'polite'
      })}
    >
      <div className={`flex-shrink-0 size-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`size-5 ${color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-body leading-snug truncate capitalize mb-0.5">
          {toast.type}
        </p>
        <p className="text-[13px] font-medium text-text-muted leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClose(toast.id); }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-low transition-colors text-text-muted hover:text-text-body"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>

      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border-subtle/30">
          <div
            className={`h-full ${color.replace('text-', 'bg-')}`}
            style={{ animation: `toast-progress ${duration / 1000}s linear forwards` }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Toaster ── */

interface ToasterProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function Toaster({ toasts, onClose }: ToasterProps) {
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleClose = useCallback(
    (id: string) => {
      if (!mounted.current) return;
      if (exiting.has(id)) return;
      setExiting((prev) => new Set(prev).add(id));
      setTimeout(() => {
        onClose(id);
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200);
    },
    [onClose, exiting]
  );

  return (
    <div className="fixed bottom-24 right-4 z-[200] flex flex-col gap-3 pointer-events-none lg:bottom-auto lg:top-4 lg:right-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto ${exiting.has(toast.id) ? 'toast-exit' : 'toast-item'}`}
        >
          <ToastItem toast={toast} onClose={handleClose} />
        </div>
      ))}
    </div>
  );
}

/* ── useToast hook ── */

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000, onClick?: () => void) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, type, duration, onClick }]);
      return id;
    },
    []
  );

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => showToast(message, type, duration),
    [showToast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number, onClick?: () => void) => showToast(message, 'success', duration, onClick),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number, onClick?: () => void) => showToast(message, 'error', duration, onClick),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number, onClick?: () => void) => showToast(message, 'info', duration, onClick),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number, onClick?: () => void) => showToast(message, 'warning', duration, onClick),
    [showToast]
  );

  return { toasts, showToast, addToast, removeToast, success, error, info, warning };
}
