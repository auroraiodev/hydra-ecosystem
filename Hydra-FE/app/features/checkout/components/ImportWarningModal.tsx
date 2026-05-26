'use client';

import { AlertTriangle, ArrowRight, ChevronLeft } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { type ImportWarningModalProps } from '../types';

export function ImportWarningModal({ open, onConfirm, onCancel }: ImportWarningModalProps) {
  if (!open) return null;

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onCancel}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal de advertencia"
      />

      {/* Modal */}
      <div
        className="relative bg-surface rounded-2xl border border-border-subtle shadow-2xl w-full max-w-md p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Icon */}
        <div className="flex items-center justify-center size-14 rounded-full bg-amber-100 dark:bg-amber-950/50 mx-auto mb-5">
          <AlertTriangle className="size-7 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-text-body text-center mb-2 uppercase tracking-tight">
          Aviso de Importación
        </h2>

        {/* Body */}
        <p className="text-sm text-text-muted text-center leading-relaxed mb-6">
          Tu pedido contiene artículos de importación. Estos pueden tardar entre{' '}
          <span className="font-bold text-text-body">30 y 90 días</span> en llegar a México
          dependiendo del tiempo en aduana.
          <br />
          <br />
          Â¿Deseas continuar con la compra?
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <FlowButton
            variant="outline"
            size="md"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ChevronLeft className="size-4" />
            Regresar
          </FlowButton>
          <FlowButton
            variant="default"
            size="md"
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2"
          >
            Continuar
            <ArrowRight className="size-4" />
          </FlowButton>
        </div>
      </div>
    </div>
  );
}
