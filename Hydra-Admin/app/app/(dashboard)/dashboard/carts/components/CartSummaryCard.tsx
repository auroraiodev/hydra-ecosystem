import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Payment24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';

interface CartSummaryCardProps {
  cartItemsCount: number;
  subtotal: number;
  isCheckingOut: boolean;
  onCheckout: () => void;
}

export function CartSummaryCard({
  cartItemsCount,
  subtotal,
  isCheckingOut,
  onCheckout,
}: CartSummaryCardProps) {
  if (cartItemsCount === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 sticky bottom-6 z-10 shadow-lg backdrop-blur-sm sm:static sm:bg-card sm:border-border sm:shadow-none sm:backdrop-none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">
              Cart Total
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary tabular-nums">
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                ({cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'})
              </span>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto h-14 sm:h-12 px-8 font-black uppercase tracking-widest text-xs"
            onClick={onCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <SpinnerIos20Regular className="size-5 animate-spin mr-2" />
            ) : (
              <Payment24Regular className="size-5 mr-2" />
            )}
            Checkout for User
          </Button>
        </div>
        <p className="text-[10px] text-center sm:text-right text-muted-foreground mt-3 italic">
          * Creating order with payment method &apos;Transfer&apos; and shipping &apos;To Arrange&apos;
        </p>
      </CardContent>
    </Card>
  );
}
