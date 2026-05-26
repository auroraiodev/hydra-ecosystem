'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { isSafeImageUrl } from '@/lib/sanitize';
import { useCardSearch, getCardImage } from '../hooks/useCardSearch';
import type { CardPickerProps } from '../types';

export function CardPicker({ query, onSelect, onClose, dark = false }: CardPickerProps) {
  const { cards, loading } = useCardSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-card-picker]')) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (query.length < 2 && !loading && cards.length === 0) return null;

  const bg = dark ? 'bg-[#0a0f0f] border-white/10 backdrop-blur-xl' : 'bg-white border-zinc-200';
  const headerBg = dark ? 'border-white/5' : 'border-zinc-100';
  const rowHover = dark ? 'hover:bg-white/5' : 'hover:bg-zinc-50';
  const textColor = dark ? 'text-white' : 'text-zinc-900';
  const mutedColor = dark ? 'text-white/40' : 'text-zinc-400';

  return (
    <div
      data-card-picker
      className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-2xl z-50 overflow-hidden border ${bg}`}
    >
      <div className={`px-3 py-2 border-b ${headerBg} flex items-center justify-between`}>
        <span className={`text-xs font-medium ${mutedColor}`}>
          Scryfall: <span className={textColor}>{query}</span>
        </span>
        <button onClick={onClose} className={`${mutedColor} text-xs hover:opacity-80`}>
          esc
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {loading && (
          <div className={`flex items-center justify-center gap-2 py-4 text-sm ${mutedColor}`}>
            <Loader2 className="size-4 animate-spin" />
            Buscandoâ€¦
          </div>
        )}
        {!loading && cards.length === 0 && query.length >= 2 && (
          <p className={`py-4 text-sm ${mutedColor} text-center`}>Sin resultados</p>
        )}
        {cards.map((card) => {
          const img = getCardImage(card);
          return (
            <button
              key={card.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect({ name: card.name, imageUrl: img });
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${rowHover}`}
            >
              {isSafeImageUrl(img) ? (
                <div className="relative w-9 h-[50px] aspect-[18/25] overflow-hidden rounded shrink-0">
                  <Image
                    src={img}
                    alt={card.name}
                    width={36}
                    height={50}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-9 h-[50px] aspect-[18/25] rounded bg-white/10 shrink-0" />
              )}
              <span className={`text-sm font-medium line-clamp-2 leading-snug ${textColor}`}>
                {card.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
