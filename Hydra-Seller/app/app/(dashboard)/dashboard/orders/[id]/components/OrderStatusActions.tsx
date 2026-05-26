'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Premium24Regular,
  CheckmarkCircle24Regular,
  ArrowUndo24Regular,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';

interface OrderStatusActionsProps {
  editStatus: string;
  statusColors: Record<string, string>;
  reviewRequested?: boolean;
  paymentMethod?: string;
  orderStatus: string;
  isRequestingReview: boolean;
  isUndoing: boolean;
  onStatusChange: (newStatus: string) => void;
  onRequestReview: () => void;
  onUndoToCart: () => void;
}

export function OrderStatusActions({
  editStatus,
  statusColors,
  reviewRequested = false,
  paymentMethod = '',
  orderStatus,
  isRequestingReview,
  isUndoing,
  onStatusChange,
  onRequestReview,
  onUndoToCart,
}: OrderStatusActionsProps) {
  return (
    <Card className="glass-card overflow-hidden border-none">
      <div className="bg-primary/[0.03] px-8 py-5 border-b border-primary/5">
        <div className="flex items-center gap-3">
          <Premium24Regular className="size-4 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/80">
            Estado y Acciones
          </h3>
        </div>
      </div>
      <CardContent className="p-8 space-y-6">
        <div className="grid gap-2">
          <label htmlFor="orderStatusSelect" className="text-sm font-medium">
            Update Status
          </label>
          <select
            id="orderStatusSelect"
            className="w-full p-2 border rounded-md"
            value={editStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {Object.keys(statusColors).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {orderStatus === 'delivered' && !reviewRequested && (
          <Button
            variant="outline"
            className="w-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            onClick={onRequestReview}
            disabled={isRequestingReview}
          >
            {isRequestingReview ? (
              <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
            ) : (
              <Premium24Regular className="size-4 mr-2" />
            )}
            Pedir Reseña
          </Button>
        )}
        {reviewRequested && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm font-medium">
            <CheckmarkCircle24Regular className="size-4 mr-2" />
            Reseña Solicitada
          </div>
        )}
        {(paymentMethod !== 'mercadopago' ||
          orderStatus === 'pending' ||
          orderStatus === 'cancelled') && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onUndoToCart}
            disabled={isUndoing}
          >
            {isUndoing ? (
              <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
            ) : (
              <ArrowUndo24Regular className="size-4 mr-2" />
            )}
            Reabrir orden al carrito
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
