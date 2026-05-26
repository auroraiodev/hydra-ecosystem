import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ordersAPI } from '@/lib/api';

const ITEM_STATUSES: { value: string; label: string; color: string; bg: string }[] = [
  {
    value: 'pending',
    label: 'Pendiente',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    value: 'ready',
    label: 'Listo para entrega',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  {
    value: 'importing',
    label: 'Importando',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    value: 'sold',
    label: 'Entregado',
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
  },
  {
    value: 'cancelled',
    label: 'Cancelado',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
  },
];

export function ItemStatusSelect({
  orderId,
  itemId,
  currentStatus,
  onRefresh,
}: {
  orderId: string;
  itemId: string;
  currentStatus: string;
  onRefresh: () => void;
}) {
  const [localStatus, setLocalStatus] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const optimisticRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (optimisticRef.current === null) {
      setLocalStatus(currentStatus);
    } else if (currentStatus === optimisticRef.current) {
      optimisticRef.current = null;
    }
  }, [currentStatus]);

  const handleChange = async (newStatus: string) => {
    if (newStatus === localStatus) return;
    const previous = localStatus;
    optimisticRef.current = newStatus;
    setLocalStatus(newStatus);
    setIsUpdating(true);
    try {
      await ordersAPI.updateItemDeliveryStatus(orderId, itemId, { status: newStatus });
      const label = ITEM_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus;
      toast.success(`Item marcado como ${label}`);
      onRefresh();
    } catch {
      optimisticRef.current = null;
      setLocalStatus(previous);
      toast.error('Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={localStatus} onValueChange={handleChange} disabled={isUpdating}>
      <SelectTrigger
        className={`h-8 text-[10px] w-full max-w-[160px] mx-auto font-black uppercase tracking-wider shadow-sm transition-all ${
          ITEM_STATUSES.find((s) => s.value === localStatus)?.bg || ''
        } ${ITEM_STATUSES.find((s) => s.value === localStatus)?.color || ''}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ITEM_STATUSES.map((s) => (
          <SelectItem
            key={s.value}
            value={s.value}
            className={`text-[10px] font-black uppercase tracking-wider ${s.color}`}
          >
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
