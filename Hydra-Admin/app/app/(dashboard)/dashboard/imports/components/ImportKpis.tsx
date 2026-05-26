'use client';

import React from 'react';
import { ITEM_STATUSES, STATUS_COLORS } from '../types';

interface ImportKpisProps {
  onFilterChange: (status: string) => void;
  currentFilter: string;
  getCountByStatus: (status: string) => number;
}

export function ImportKpis({ onFilterChange, currentFilter, getCountByStatus }: ImportKpisProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {ITEM_STATUSES.map((s) => {
        const Icon = s.icon;
        const active = currentFilter === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onFilterChange(active ? 'all' : s.value)}
            className={`text-left rounded-xl border transition-all ${STATUS_COLORS[s.value]} ${
              active
                ? 'ring-2 ring-offset-2 ring-current shadow-md scale-[1.02]'
                : 'opacity-80 hover:opacity-100 hover:shadow-sm'
            }`}
          >
            <div className="pb-2 pt-4 px-4">
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Icon className="size-3.5" />
                {s.label}
              </p>
            </div>
            <div className="px-4 pb-4">
              <p className="text-2xl font-semibold">{getCountByStatus(s.value)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
