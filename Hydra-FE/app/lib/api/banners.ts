import { API_URL } from '../constants/api';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  desktop_image: string;
  mobile_image?: string;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  order: number;
  tcg_id?: string;
}

export async function getActiveBanners(tcgId?: string): Promise<Banner[]> {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const url = new URL(`${API_URL}/banners/active`, baseUrl);
    if (tcgId) url.searchParams.append('tcgId', tcgId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch banners: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Banners] Fetch timed out (backend may be unreachable). Returning empty list.');
    } else {
      console.error('Error fetching active banners:', error);
    }
    return [];
  }
}
