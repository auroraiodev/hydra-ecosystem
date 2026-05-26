import { API_URL } from '../constants/api';
import type { Tcg } from '../types/tcg';

export async function getActiveTCGs(): Promise<Tcg[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_URL}/tcgs/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch TCGs: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : ((data as { data?: Tcg[] })?.data ?? []);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[TCGs] Fetch timed out (backend may be unreachable). Returning empty list.');
    } else {
      console.error('Error fetching active TCGs:', error);
    }
    return [];
  }
}
