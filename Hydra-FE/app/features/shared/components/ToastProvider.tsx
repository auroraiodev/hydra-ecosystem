'use client';

import * as React from 'react';
import { createContext, ReactNode, useMemo } from 'react';
import { useToast } from 'arcane-vault-ui';
import { Toaster } from '@/features/shared/ui/Toaster';

interface ToastContextType {
  success: (message: string, duration?: number, onClick?: () => void) => void;
  error: (message: string, duration?: number, onClick?: () => void) => void;
  info: (message: string, duration?: number, onClick?: () => void) => void;
  warning: (message: string, duration?: number, onClick?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// No-op functions for SSR or cases where context is missing
const noopToast = () => '';
const safeContext: ToastContextType = {
  success: noopToast,
  error: noopToast,
  info: noopToast,
  warning: noopToast,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, removeToast, success, error, info, warning } = useToast();

  const value = useMemo(() => ({ success, error, info, warning }), [success, error, info, warning]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = React.use(ToastContext);

  // Return safe no-op context instead of throwing to prevent SSR crashes
  if (context === undefined) {
    return safeContext;
  }

  return context;
}
