'use client';

import { useEffect } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClick?: () => void;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    Icon: CircleCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
  },
  error: {
    Icon: CircleX,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/10',
  },
  info: {
    Icon: Info,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    glow: 'shadow-primary/10',
  },
  warning: {
    Icon: TriangleAlert,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/10',
  },
};

const typeLabels: Record<ToastType, string> = {
  success: 'Listo',
  error: 'Error',
  info: 'Información',
  warning: 'Advertencia',
};

export function ToastComponent({ toast, onClose }: ToastProps) {
  const { Icon, color, bg, border, glow } = toastConfig[toast.type];
  const duration = toast.duration ?? 4000;
  const { onClick } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(toast.id), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, toast.id, onClose]);

  return (
    <div
      className={`
        relative group flex items-center gap-4 p-4 pr-5 rounded-2xl 
        border ${border} bg-surface/80 backdrop-blur-xl 
        shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] 
        ${glow} min-w-[320px] max-w-sm overflow-hidden
        ${onClick ? 'cursor-pointer hover:bg-surface/90 transition-all' : ''}
      `}
      role="alert"
      aria-live="polite"
      onClick={
        onClick
          ? () => {
              onClick();
              onClose(toast.id);
            }
          : undefined
      }
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
                onClose(toast.id);
              }
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Icon Wrapper */}
      <div className={`flex-shrink-0 size-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`size-5 ${color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-body leading-snug truncate mb-0.5">
          {typeLabels[toast.type]}
        </p>
        <p className="text-[13px] font-medium text-text-muted leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-low transition-colors text-text-muted hover:text-text-body"
        aria-label="Cerrar"
      >
        <X className="size-4" />
      </button>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border-subtle/30">
          <div
            className={`h-full ${color.replace('text-', 'bg-')}`}
            style={{
              animation: `toast-progress ${duration / 1000}s linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
