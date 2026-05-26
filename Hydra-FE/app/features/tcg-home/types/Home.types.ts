import type { Tcg } from '@/lib/types/tcg';
import type { Review } from '@/lib/api/reviews';

export interface TCGHomeViewProps {
  selectedTcg: Tcg;
  activeTcgs: Tcg[];
  reviews: Review[];
}

export interface TcgHomeSectionsProps {
  tcg: Tcg;
}

export interface HeroCarouselProps {
  tcgId: string;
}
