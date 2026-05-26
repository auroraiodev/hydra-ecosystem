import { API_URL } from '@/lib/constants/api';

export interface PublicSettings {
  support_email?: string;
  contact_phone?: string;
  site_name?: string;
  marketplace_name?: string;
  site_logo?: string;
  site_loader?: string;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    // Abort after 8s to prevent build-time hangs if the backend is unreachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_URL}/settings/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(
        'Public settings fetch timed out (backend may be unreachable). Using default settings.'
      );
    } else {
      console.error('Error fetching public settings:', error);
    }
    return {};
  }
}
