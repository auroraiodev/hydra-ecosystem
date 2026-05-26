import { Clock24Regular, Airplane24Regular, Box24Regular, CheckmarkCircle24Regular } from '@fluentui/react-icons';

export interface ImportItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  cardName: string;
  expansion: string;
  condition: string;
  language: string;
  isFoil: boolean;
  isSurgeFoil: boolean;
  deliveryStatus: string;
  importationId: string;
  image?: string;
  price: number;
  quantity: number;
  itemType: 'importation' | 'importacion';
}

export const ITEM_STATUSES = [
  { value: 'pending', label: 'Pendiente', icon: Clock24Regular },
  { value: 'importing', label: 'Importando', icon: Airplane24Regular },
  { value: 'ready', label: 'Listo para entrega', icon: Box24Regular },
  { value: 'sold', label: 'Entregado', icon: CheckmarkCircle24Regular },
];

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  importing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  ready: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  sold: 'bg-muted text-muted-foreground border-border',
};
