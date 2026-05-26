import { Bell, Package, CreditCard, RefreshCw, Check } from 'lucide-react';

export const NOTIFICATION_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  ORDER_STATUS: { icon: Package, color: 'text-blue-500' },
  ITEM_DELIVERY: { icon: Check, color: 'text-green-500' },
  PAYMENT_SUCCESS: { icon: CreditCard, color: 'text-primary' },
  WALLET_TX: { icon: RefreshCw, color: 'text-orange-500' },
  DEFAULT: { icon: Bell, color: 'text-zinc-500' },
};

export const NOTIFICATION_ANIMATIONS = {
  container: {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.95 },
    transition: { duration: 0.2 },
  },
};
