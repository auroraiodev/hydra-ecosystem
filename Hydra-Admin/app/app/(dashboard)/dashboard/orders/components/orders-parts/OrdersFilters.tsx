'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search24Regular } from '@fluentui/react-icons';
import { UserAutocomplete } from '@/components/orders/user-autocomplete';

interface OrdersFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  userId: string;
  onUserChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
}

export function OrdersFilters({
  searchTerm,
  onSearchChange,
  userId,
  onUserChange,
  selectedStatus,
  onStatusChange,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by order #, customer or email…"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <UserAutocomplete
        value={userId}
        pendingOrdersOnly={true}
        onValueChange={onUserChange}
      />
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-input bg-background rounded-md text-sm w-full sm:min-w-[150px]"
      >
        <option value="all">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
        <option value="processing">Procesando</option>
        <option value="shipped">Enviado</option>
        <option value="delivered">Entregado</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>
  );
}
