export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  roles?: { name: string; display_name: string };
}

export interface ApiProduct {
  id: string;
  cardName?: string;
  name?: string;
  stock: number;
  price?: number | string;
  finalPrice?: number;
  img?: string;
  expansion?: string;
  variant?: string;
  foil?: boolean;
  surgeFoil?: boolean;
  isLocalInventory?: boolean;
  categories?: { name: string; display_name?: string };
  conditions?: { name: string; display_name?: string };
  languages?: { name: string; display_name?: string };
}

export type Mode = 'idle' | 'counting' | 'review';

export interface CountEntry {
  productId: string;
  systemStock: number;
  physicalStock: number;
  skipped: boolean;
}

export function userName(u: User) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return full || u.username || u.email;
}

export function productName(p: ApiProduct) {
  return p.cardName || p.name || '—';
}

export function productDetail(p: ApiProduct) {
  const parts = [
    p.expansion || p.variant,
    p.conditions?.display_name || p.conditions?.name,
    p.languages?.display_name || p.languages?.name,
  ].filter(Boolean);
  return parts.join(' · ') || '—';
}
