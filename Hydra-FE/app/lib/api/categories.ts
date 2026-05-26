import { API_URL } from '@/lib/constants/api';

export interface Category {
  id: string;
  name: string;
  display_name: string;
  order: number;
  _count?: {
    singles: number;
  };
}

export async function getCategoriesWithProducts(tcgId?: string): Promise<Category[]> {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const url = new URL(`${API_URL}/categories/with-products`, baseUrl);
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
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`[Categories] Fetch timed out for tcgId=${tcgId}.`);
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `No se pudo conectar al backend en ${API_URL}. Por favor asegúrate de que el backend esté ejecutándose.`
      );
    }
    throw error;
  }
}

// Note: getConditions, getLanguages, getRarities are unused
// export async function getConditions(): Promise<Condition[]> {
//   try {
//     const response = await fetch(`${API_URL}/conditions`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//
//     if (!response.ok) {
//       throw new Error(`Failed to fetch conditions: ${response.status} ${response.statusText}`);
//     }
//
//     const data = await response.json();
//     return data.data || data;
//   } catch (error) {
//     if (error instanceof TypeError && error.message === 'Failed to fetch') {
//       throw new Error(
//         `No se pudo conectar al backend en ${API_URL}. Por favor asegúrate de que el backend esté ejecutándose.`
//       );
//     }
//     throw error;
//   }
// }
//
// export async function getLanguages(): Promise<Language[]> {
//   try {
//     const response = await fetch(`${API_URL}/languages`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//
//     if (!response.ok) {
//       throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
//     }
//
//     const data = await response.json();
//     return data.data || data;
//   } catch (error) {
//     if (error instanceof TypeError && error.message === 'Failed to fetch') {
//       throw new Error(
//         `No se pudo conectar al backend en ${API_URL}. Por favor asegúrate de que el backend esté ejecutándose.`
//       );
//     }
//     throw error;
//   }
// }
//
// export async function getRarities(): Promise<Rarity[]> {
//   try {
//     const response = await fetch(`${API_URL}/rarities`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//
//     if (!response.ok) {
//       throw new Error(`Failed to fetch rarities: ${response.status} ${response.statusText}`);
//     }
//
//     const data = await response.json();
//     return data.data || data;
//   } catch (error) {
//     if (error instanceof TypeError && error.message === 'Failed to fetch') {
//       throw new Error(
//         `No se pudo conectar al backend en ${API_URL}. Por favor asegúrate de que el backend esté ejecutándose.`
//       );
//     }
//     throw error;
//   }
// }

export async function getActiveCategories(tcgId?: string): Promise<Category[]> {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const url = new URL(`${API_URL}/categories/active`, baseUrl);
    if (tcgId) url.searchParams.append('tcgId', tcgId);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active categories: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`No se pudo conectar al backend en ${API_URL}.`);
    }
    throw error;
  }
}
