'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { FlowButton } from './flow-button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  fullScreen = false,
}: ModalProps) {
  const mounted = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    mounted.current = true;
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);
  handleKeyDownRef.current = handleKeyDown;

  // Save/restore focus and set up focus trap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDownRef.current?.(e);

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handler);

      // Focus first focusable element in modal
      requestAnimationFrame(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    } else {
      document.removeEventListener('keydown', handler);
      previousFocusRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen]);

  if (!isOpen || !mounted.current) return null;

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center cursor-pointer"
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`relative glass-panel ghost-border shadow-2xl ${
          fullScreen
            ? 'size-full min-h-screen m-0 rounded-none'
            : 'w-full max-w-lg mx-4 mt-20 rounded-2xl'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <h2 id="modal-title" className="text-lg font-semibold text-text-body">
              {title}
            </h2>
            <FlowButton
              onClick={onClose}
              variant="ghost"
              size="icon"
              simple
              className="p-2 text-text-muted transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </FlowButton>
          </div>
        )}

        {/* Content */}
        <div className={title ? 'p-4' : 'p-6'}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
