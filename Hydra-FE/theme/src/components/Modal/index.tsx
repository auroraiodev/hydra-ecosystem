"use client";

import { createPortal } from 'react-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '../Button';

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
  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  }, [handleKeyDown]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDownRef.current?.(e);
    
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', listener);
      requestAnimationFrame(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    } else {
      document.removeEventListener('keydown', listener);
      previousFocusRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', listener);
  }, [isOpen]);

  if (!isOpen || !mounted.current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      onClick={onClose}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        ref={modalRef}
        role="presentation"
        onKeyDown={(e) => e.stopPropagation()}
        className={[
          'relative glass-panel ghost-border shadow-2xl',
          fullScreen
            ? 'w-full h-full min-h-screen m-0 rounded-none'
            : 'w-full max-w-lg mx-4 mt-20 rounded-2xl',
          className,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <h2 id="modal-title" className="text-lg font-semibold text-text-body">
              {title}
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              simple
              className="p-2 text-text-muted transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </Button>
          </div>
        )}
        <div className={title ? 'p-4' : 'p-6'}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
