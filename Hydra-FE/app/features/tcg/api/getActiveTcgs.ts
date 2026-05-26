import { API_URL } from '@/lib/constants/api';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { TcgApiResponse } from '../types';

interface BackendTcg {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  logo_url: string | null;
  icon_url: string | null;
  order: number;
  _count?: {
    singles: number;
    categories: number;
    total_articles?: number;
  };
}

export async function getActiveTcgs(): Promise<TcgApiResponse[]> {
  try {
    const res = await fetch(`${API_URL}/tcgs/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch TCGs: ${res.status}`);
    }

    const data = await res.json();
    const raw: BackendTcg[] = Array.isArray(data) ? data : (data.data ?? []);

    return raw.map((tcg) => ({
      id: tcg.id,
      name: tcg.display_name || tcg.name,
      displayName: tcg.display_name || tcg.name,
      slug: tcg.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logoUrl: resolveImageUrl(tcg.logo_url) || null,
      iconUrl: resolveImageUrl(tcg.icon_url) || null,
      cardCount: tcg._count?.total_articles ?? tcg._count?.singles ?? 0,
      primaryColor: null,
      isActive: tcg.is_active,
      order: tcg.order ?? 0,
    }));
  } catch (error) {
    console.error('[getActiveTcgs] Error:', error);
    return [];
  }
}
