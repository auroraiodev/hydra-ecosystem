'use client';

import { useState, useCallback } from 'react';
import { ToastComponent, type Toast } from './Toast';

interface ToasterProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function Toaster({ toasts, onClose }: ToasterProps) {
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const handleClose = useCallback(
    (id: string) => {
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
    <div className="fixed bottom-[136px] right-4 z-[200] flex flex-col gap-3 pointer-events-none lg:bottom-auto lg:top-4 lg:right-4">
      {toasts.map((toast) => {
        const isExiting = exiting.has(toast.id);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${isExiting ? 'toast-exit' : 'toast-item'}`}
          >
            <ToastComponent toast={toast} onClose={handleClose} />
          </div>
        );
      })}
    </div>
  );
}
