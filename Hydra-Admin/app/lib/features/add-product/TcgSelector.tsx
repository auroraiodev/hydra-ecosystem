'use client';

import React from 'react';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { Box16Regular } from '@fluentui/react-icons';
import type { Tcg } from './types';

interface TcgSelectorProps {
  tcgs: Tcg[];
  selectedTcg: Tcg | null;
  onSelectTcg: (tcg: Tcg | null) => void;
  disabled?: boolean;
}

export function TcgSelector({ tcgs, selectedTcg, onSelectTcg, disabled }: TcgSelectorProps) {
  if (tcgs.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 py-1 ${disabled ? 'opacity-50 grayscale' : ''}`}
    >
      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mr-1">
        Supracategoría:
      </span>
      {tcgs.map((tcg) => {
        const isSelected = selectedTcg?.id === tcg.id;

        return (
          <button
            key={tcg.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTcg(tcg)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all ${
              isSelected
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
            }`}
          >
            {tcg.icon_url || tcg.logo_url ? (
              <Image
                src={resolveImageUrl(tcg.icon_url || tcg.logo_url || '')}
                alt=""
                width={14}
                height={14}
                className={`object-contain ${isSelected ? 'brightness-0 invert' : ''}`}
                unoptimized
              />
            ) : (
              <Box16Regular className="size-3" />
            )}
            {tcg.display_name}
          </button>
        );
      })}
    </div>
  );
}
