'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Payment24Regular,
  CheckmarkCircle24Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';

interface OrderPaymentSectionProps {
  paymentMethod?: string;
  paymentStatus?: string;
  isMarkingPaidLocal: boolean;
  onMarkPaidLocal: () => void;
}

export function OrderPaymentSection({
  paymentMethod = '',
  paymentStatus = '',
  isMarkingPaidLocal,
  onMarkPaidLocal,
}: OrderPaymentSectionProps) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <Payment24Regular className="size-4 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Detalles del Pago
          </h3>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Method</p>
          <p className="font-medium capitalize">
            {paymentMethod === 'mercadopago'
              ? 'Mercado Pago'
              : paymentMethod?.replace('_', ' ') || 'transfer'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium uppercase
              ${
                paymentStatus === 'approved'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : paymentStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }
            `}
          >
            {paymentStatus}
          </span>
        </div>
        {paymentStatus !== 'approved' && (
          <Button
            variant="outline"
            className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            onClick={onMarkPaidLocal}
            disabled={isMarkingPaidLocal}
          >
            {isMarkingPaidLocal ? (
              <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
            ) : (
              <CheckmarkCircle24Regular className="size-4 mr-2" />
            )}
            Marcar como Pagado (Local)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
