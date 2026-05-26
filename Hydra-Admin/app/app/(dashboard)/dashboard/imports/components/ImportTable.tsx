'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SpinnerIos20Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  ChevronUpDown24Regular,
} from '@fluentui/react-icons';
import { ProductImageZoom } from '@/components/product-image-zoom';
import { ClientDate } from '@/components/ClientDate';
import { type ImportItem, ITEM_STATUSES, STATUS_COLORS } from '../types';

interface ItemStatusSelectProps {
  item: ImportItem;
  onStatusChange: (itemId: string, orderId: string, newStatus: string) => Promise<void>;
}

function ItemStatusSelect({ item, onStatusChange }: ItemStatusSelectProps) {
  const [localStatus, setLocalStatus] = useState(item.deliveryStatus || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const optimisticRef = useRef<string | null>(null);

  useEffect(() => {
    if (optimisticRef.current === null) {
      setLocalStatus(item.deliveryStatus || 'pending');
    } else if (item.deliveryStatus === optimisticRef.current) {
      optimisticRef.current = null;
    }
  }, [item.deliveryStatus]);

  const handleChange = async (newStatus: string) => {
    if (newStatus === localStatus || isUpdating) return;
    const previous = localStatus;
    optimisticRef.current = newStatus;
    setLocalStatus(newStatus);
    setIsUpdating(true);
    try {
      await onStatusChange(item.id, item.orderId, newStatus);
    } catch {
      optimisticRef.current = null;
      setLocalStatus(previous);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={localStatus} onValueChange={handleChange} disabled={isUpdating}>
      <SelectTrigger className={`h-8 text-xs w-44 border ${STATUS_COLORS[localStatus] ?? ''}`}>
        {isUpdating ? <SpinnerIos20Regular className="size-3 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {ITEM_STATUSES.map((s) => {
          const Icon = s.icon;
          return (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              <span className="flex items-center gap-1.5">
                <Icon className="size-3" />
                {s.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

type ImportSortField = 'cardName' | 'orderDate' | 'price' | 'quantity' | 'deliveryStatus';

function SortIcon({ col, sortField, sortDir }: { col: ImportSortField; sortField: ImportSortField | ''; sortDir: 'asc' | 'desc' }) {
  if (sortField !== col) return <ChevronUpDown24Regular className="size-3 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3 ml-1" />
    : <ChevronDown24Regular className="size-3 ml-1" />;
}

interface ImportTableProps {
  items: ImportItem[];
  statusFilter: string;
  onStatusChange: (itemId: string, orderId: string, newStatus: string) => Promise<void>;
}

function ImportCard({ item, onStatusChange }: { item: ImportItem; onStatusChange: ImportTableProps['onStatusChange'] }) {
  return (
    <div className={`p-4 border-b last:border-b-0 ${item.deliveryStatus === 'sold' ? 'opacity-60' : ''}`}>
      <div className="flex gap-3 mb-3">
        <ProductImageZoom src={item.image} alt={item.cardName} className="h-16 w-12 shrink-0 rounded-md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{item.cardName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.expansion && (
              <Badge variant="secondary" className="text-[10px] uppercase">{item.expansion}</Badge>
            )}
            <Badge variant="outline" className="text-[10px] uppercase">{item.condition}</Badge>
            <Badge variant="outline" className="text-[10px] uppercase text-blue-600 border-blue-200">{item.language}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono text-[10px]">#{item.orderNumber}</Badge>
            <span>{item.customerName}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{item.quantity}x</span> &middot; ${item.price.toFixed(2)}
        </div>
        <ItemStatusSelect item={item} onStatusChange={onStatusChange} />
      </div>
    </div>
  );
}

export function ImportTable({ items, statusFilter, onStatusChange }: ImportTableProps) {
  const [sortField, setSortField] = useState<ImportSortField | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: ImportSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortField) return items;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      switch (sortField) {
        case 'cardName': return a.cardName.localeCompare(b.cardName) * dir;
        case 'orderDate': return (a.orderDate || '').localeCompare(b.orderDate || '') * dir;
        case 'price': return (a.price - b.price) * dir;
        case 'quantity': return (a.quantity - b.quantity) * dir;
        case 'deliveryStatus': return (a.deliveryStatus || '').localeCompare(b.deliveryStatus || '') * dir;
        default: return 0;
      }
    });
  }, [items, sortField, sortDir]);

  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        {statusFilter === 'all'
          ? 'No hay artículos de importación en pedidos activos.'
          : `No hay artículos con estado "${ITEM_STATUSES.find((s) => s.value === statusFilter)?.label}".`}
      </div>
    );
  }

  const thSort = 'p-3 text-left font-medium cursor-pointer hover:bg-muted select-none';

  return (
    <>
      {/* Mobile card layout */}
      <div className="divide-y md:hidden">
        {sorted.map((item) => (
          <ImportCard key={item.id} item={item} onStatusChange={onStatusChange} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className={thSort} onClick={() => handleSort('cardName')}>
                <span className="flex items-center">Carta<SortIcon col="cardName" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className={thSort} onClick={() => handleSort('orderDate')}>
                <span className="flex items-center">Pedido<SortIcon col="orderDate" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className="p-3 text-left font-medium">Detalles</th>
              <th className={`${thSort} text-center w-16`} onClick={() => handleSort('quantity')}>
                <span className="flex items-center justify-center">Cant.<SortIcon col="quantity" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className={`${thSort} text-right`} onClick={() => handleSort('price')}>
                <span className="flex items-center justify-end">Precio<SortIcon col="price" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className={`${thSort} text-center w-52`} onClick={() => handleSort('deliveryStatus')}>
                <span className="flex items-center justify-center">Estado<SortIcon col="deliveryStatus" sortField={sortField} sortDir={sortDir} /></span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors ${
                  item.deliveryStatus === 'sold' ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/30'
                }`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <ProductImageZoom src={item.image} alt={item.cardName} className="h-20 w-14 shrink-0" />
                    <div>
                      <p className="font-semibold leading-tight">{item.cardName}</p>
                      {item.importationId && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">ID: {item.importationId}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit font-mono text-xs">#{item.orderNumber}</Badge>
                    <span className="text-xs truncate max-w-[140px]">{item.customerName}</span>
                    {item.orderDate && (
                      <ClientDate date={item.orderDate} format={{ day: '2-digit', month: 'short', year: 'numeric' }} />
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {item.expansion && (
                      <Badge variant="secondary" className="text-[10px] uppercase">{item.expansion}</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] uppercase">{item.condition}</Badge>
                    <Badge variant="outline" className="text-[10px] uppercase text-blue-600 border-blue-200">{item.language}</Badge>
                    {item.isSurgeFoil ? (
                      <Badge className="text-[10px] bg-purple-500 text-white hover:bg-purple-500">SURGE FOIL</Badge>
                    ) : item.isFoil ? (
                      <Badge className="text-[10px] bg-yellow-400 text-yellow-950 hover:bg-yellow-400">FOIL</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="p-3 text-center font-medium">{item.quantity}</td>
                <td className="p-3 text-right font-medium">${item.price.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <ItemStatusSelect item={item} onStatusChange={onStatusChange} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
