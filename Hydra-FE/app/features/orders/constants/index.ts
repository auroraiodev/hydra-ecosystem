import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export const ORDER_STATUS_CONFIG: Record<
  string,
  { text: string; color: string; icon: typeof Clock }
> = {
  PENDING: {
    text: 'Pendiente de Pago',
    color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    icon: Clock,
  },
  PAID: {
    text: 'Pagado',
    color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    icon: CheckCircle2,
  },
  PROCESSING: {
    text: 'En Proceso',
    color: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
    icon: CheckCircle2,
  },
  SHIPPED: {
    text: 'Enviado',
    color: 'bg-green-500/10 text-green-400 border border-green-500/20',
    icon: CheckCircle2,
  },
  COMPLETED: {
    text: 'Completado',
    color: 'bg-green-500/10 text-green-400 border border-green-500/20',
    icon: CheckCircle2,
  },
  CANCELLED: {
    text: 'Cancelado',
    color: 'bg-red-500/10 text-red-400 border border-red-500/20',
    icon: XCircle,
  },
};

export const DEFAULT_STATUS_CONFIG = {
  text: 'Desconocido',
  color: 'bg-white/5 text-text-muted border border-white/10',
  icon: Clock,
};


export const CONDITION_MAP: Record<string, string> = {
  'Near Mint': 'Casi Nueva (NM)',
  'Lightly Played': 'Ligeramente Jugada (LP)',
  'Moderately Played': 'Moderadamente Jugada (MP)',
  'Heavily Played': 'Muy Jugada (HP)',
  Damaged: 'Dañada (DM)',
};

export const PAYMENT_STATUS_MAP: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  failure: 'Fallido',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
};
