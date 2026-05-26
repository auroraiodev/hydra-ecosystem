'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { ArrowSync24Regular } from '@fluentui/react-icons';
import { isSafeImageUrl } from '@/lib/sanitize';

interface ScryfallCard {
  id: string;
  name: string;
  image_uris?: { small: string; normal: string };
  card_faces?: Array<{ image_uris?: { small: string; normal: string } }>;
}

export interface SelectedCard {
  name: string;
  imageUrl: string;
}

interface Props {
  query: string;
  onSelect: (card: SelectedCard) => void;
  onClose: () => void;
}

function getCardImage(card: ScryfallCard): string {
  return card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? '';
}

function useScryfallCards(searchQuery: string) {
  const { data: cards = [], isLoading: loading } = useSWR<ScryfallCard[]>(
    searchQuery.length >= 2 ? `scryfall-${searchQuery}` : null,
    async () => {
      const r = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&order=name&unique=cards`
      );
      if (!r.ok) return [];
      const data = await r.json();
      return (data?.data ?? []).slice(0, 8);
    },
    { dedupingInterval: 10000 }
  );

  return { cards, loading };
}

export function CardPicker({ query, onSelect, onClose }: Props) {
  const { cards, loading } = useScryfallCards(query);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-card-picker]')) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const visibleCards = query.length < 2 ? [] : cards;

  if (query.length < 2 && !loading && visibleCards.length === 0) return null;

  return (
    <div
      data-card-picker
      className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Scryfall: <span className="text-foreground">{query}</span>
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          esc
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <ArrowSync24Regular className="size-4 animate-spin" />
            Buscando…
          </div>
        )}
        {!loading && cards.length === 0 && query.length >= 2 && (
          <p className="py-4 text-sm text-muted-foreground text-center">Sin resultados</p>
        )}
        {visibleCards.map((card) => {
          const img = getCardImage(card);
          return (
            <button
              key={card.id}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                onSelect({ name: card.name, imageUrl: img });
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
            >
              {isSafeImageUrl(img) ? (
                <Image
                  src={img}
                  alt={card.name}
                  width={36}
                  height={50}
                  className="w-9 h-[50px] object-cover rounded shrink-0 border border-border/60"
                />
              ) : (
                <div className="w-9 h-[50px] rounded bg-muted shrink-0" />
              )}
              <span className="text-sm font-medium line-clamp-2 leading-snug">{card.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Format a selected card as an embeddable message token */
export function formatCardToken(card: SelectedCard): string {
  return `[[card:${card.name}||${card.imageUrl}]]`;
}

/** Parse message content — returns React-renderable segments */
export function parseMessageContent(
  content: string
): Array<{ type: 'text'; value: string } | { type: 'card'; name: string; imageUrl: string }> {
  const parts: ReturnType<typeof parseMessageContent> = [];
  const regex = /\[\[card:(.+?)\|\|(.+?)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: content.slice(last, match.index) });
    }
    parts.push({ type: 'card', name: match[1], imageUrl: match[2] });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push({ type: 'text', value: content.slice(last) });
  }
  return parts;
}
