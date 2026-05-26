'use client';

import Image from 'next/image';
import { Box24Regular } from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
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
      <span className="text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground mr-1">
        Supracategoría:
      </span>
      {tcgs.map((tcg) => {
        const isSelected = selectedTcg?.id === tcg.id;
        const iconUrl = tcg.icon_url || tcg.logo_url;

        return (
          <button
            key={tcg.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTcg(tcg)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all ${
              isSelected
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800'
            }`}
          >
            {iconUrl ? (
              <div className={`relative size-3.5 ${isSelected ? 'brightness-0 invert' : ''}`}>
                <Image
                  src={resolveImageUrl(iconUrl)}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <Box24Regular className="size-3" />
            )}
            {tcg.display_name}
          </button>
        );
      })}
    </div>
  );
}
