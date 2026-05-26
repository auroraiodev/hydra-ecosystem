import { type Product } from '@/lib/api';
import { type CarouselApi } from '@/features/shared/ui/carousel';

export interface ProductGalleryProps {
  images: string[];
  productName: string;
  isFoil: boolean;
}

export interface ProductInfoProps {
  product: Product;
  buildShareUrl: () => string;
}

export interface ProductThumbsProps {
  images: string[];
  productName: string;
  currentIndex: number;
  goTo: (index: number) => void;
  setThumbsApi: (api: CarouselApi) => void;
}

export type AltItem = {
  id?: string;
  cardName?: string;
  name?: string;
  price?: string | number;
  finalPrice?: string | number;
  img?: string | null;
  imageUrl?: string | null;
  stock?: number;
  expansion?: string | null;
  variant?: string | null;
  condition_name?: string | null;
  condition?: string | null;
  conditions?: { name?: string; display_name?: string };
  language_name?: string | null;
  language?: string | null;
  languages?: { name?: string; display_name?: string };
  isLocalInventory?: boolean;
  foil?: boolean;
  surgeFoil?: boolean;
  importationId?: string | null;
  tags?: string[] | Array<{ name: string }>;
  metadata?: string[];
};
