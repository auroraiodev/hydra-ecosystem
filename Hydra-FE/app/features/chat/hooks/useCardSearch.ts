import { useQuery } from '@tanstack/react-query';
import type { ScryfallCard, UseCardSearchReturn } from '../types';

export function useCardSearch(query: string): UseCardSearchReturn {
  const { data: cards = [], isLoading: loading } = useQuery({
    queryKey: ['scryfall-search', query],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&unique=cards`,
        { signal }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.data ?? []).slice(0, 8) as ScryfallCard[];
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });

  return { cards, loading };
}

export function getCardImage(card: ScryfallCard): string {
  return card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? '';
}
