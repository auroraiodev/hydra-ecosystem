'use client';

import React from 'react';
import { STEP_LABELS, STEP_ICONS } from '../constants';

interface MobileStepIndicatorProps {
  mobileStep: number;
  finalTotal: number;
  formatPrice: (price: number) => React.ReactNode;
}

export function MobileStepIndicator({
  mobileStep,
  finalTotal,
  formatPrice,
}: MobileStepIndicatorProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Header with Total */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-vault-text">Checkout</h1>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-vault-text-muted font-bold">Total</span>
          <span className="text-lg font-bold text-teal">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = mobileStep === stepNumber;
          const isCompleted = mobileStep > stepNumber;
          const Icon = STEP_ICONS[index];

          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center flex-1 gap-1.5">
                <div
                  className={`
                    size-9 rounded-xl flex items-center justify-center border transition-all duration-300
                    ${isActive 
                      ? 'bg-teal border-teal text-white shadow-lg shadow-teal/20 scale-110' 
                      : isCompleted
                        ? 'bg-teal/10 border-teal/20 text-teal'
                        : 'bg-vault-surface-low border-vault-border text-vault-text-muted'
                    }
                  `}
                >
                  <Icon className="size-4" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-teal' : 'text-vault-text-muted'}`}>
                  {label}
                </span>
              </div>
              {index < STEP_LABELS.length - 1 && (
                <div className="h-px flex-1 bg-vault-border mb-4" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
