import { API_URL } from '@/lib/constants/api';
import { logger } from '@/lib/utils/logger';
import { CardDataSchema } from '@/lib/validations/product';
import type { Product, AlternativeVersion } from '../types';

export async function getAlternativeVersions(
  productId: string,
  limit: number = 10
): Promise<AlternativeVersion[]> {
  const response = await fetch(`${API_URL}/singles/${productId}/alternatives?limit=${limit}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  return json.data || json || [];
}

export async function getProduct(
  id: string,
  cardName?: string,
  language?: string
): Promise<Product> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let url;
  if (isUuid) {
    url = `${API_URL}/singles/${id}`;
  } else {
    url = `${API_URL}/singles/importation/${id}`;
    const qp = new URLSearchParams();
    if (cardName) qp.set('cardName', cardName);
    if (language) qp.set('language', language);
    const qs = qp.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Producto no encontrado');
    }
    throw new Error('Error al cargar el producto');
  }

  const json = await response.json();
  const data = json.data || json;

  if (Array.isArray(data)) {
    if (language) {
      const languageMap: Record<string, string> = {
        inglés: 'english',
        español: 'spanish',
        japonés: 'japanese',
        japanese: 'japanese',
        english: 'english',
        spanish: 'spanish',
      };

      const normalizedQueryLang = languageMap[language.toLowerCase()] || language.toLowerCase();

      const match = data.find((item: Record<string, unknown>) => {
        const itemLangName = (
          (item.languages as { name?: string })?.name ||
          (item.language as string) ||
          ''
        ).toLowerCase();
        const itemLangDisplay = (
          (item.languages as { display_name?: string })?.display_name || ''
        ).toLowerCase();
        const normalizedItemLang = languageMap[itemLangName] || itemLangName;

        return (
          normalizedItemLang === normalizedQueryLang || itemLangDisplay === language.toLowerCase()
        );
      });
      if (match) {
        const validation = CardDataSchema.safeParse(match);
        if (!validation.success) {
          logger.error('[singles/getProduct] Match validation failed', {
            errors: validation.error.format(),
            data: match,
          });
        }
        return match;
      }
    }
    const first = data[0];
    const validation = CardDataSchema.safeParse(first);
    if (!validation.success) {
      logger.error('[singles/getProduct] First item validation failed', {
        errors: validation.error.format(),
        data: first,
      });
    }
    return first;
  }

  const validation = CardDataSchema.safeParse(data);
  if (!validation.success) {
    logger.error('[singles/getProduct] Validation failed', {
      errors: validation.error.format(),
      data,
    });
  }

  return data;
}

/**
 * Robust price resolver that queries the product, alternative versions,
 * or performs a search fallback by cardName if price is zero.
 */
export async function fetchValuedPrice(
  id: string,
  cardName?: string,
  language?: string
): Promise<number> {
  // 1. Try direct product fetch
  try {
    const product = await getProduct(id, cardName, language);
    const price = product.price ?? (product as unknown as Record<string, unknown>).finalPrice ?? 0;
    if (typeof price === 'number' && price > 0) return price;
  } catch (e) {
    logger.error('[fetchValuedPrice] getProduct failed', e);
  }

  // 2. Try alternative versions
  try {
    const alternatives = await getAlternativeVersions(id, 10);
    const firstValuedAlt = alternatives.find(
      (alt) => alt.price > 0 || (alt.price_mxn_local ?? 0) > 0 || (alt.price_mxn_importation ?? 0) > 0
    );
    if (firstValuedAlt) {
      return firstValuedAlt.price || firstValuedAlt.price_mxn_local || firstValuedAlt.price_mxn_importation || 0;
    }
  } catch (e) {
    logger.error('[fetchValuedPrice] getAlternativeVersions failed', e);
  }

  // 3. Try search again by cardName
  if (cardName) {
    try {
      const searchParams = new URLSearchParams({ q: cardName, limit: '10' });
      const response = await fetch(`${API_URL}/search/local?${searchParams.toString()}`);
      if (response.ok) {
        const json = await response.json();
        const items = (json.data || json || []) as Array<{
          price?: string | number;
          finalPrice?: number;
          price_mxn_local?: number;
          price_mxn_importation?: number;
        }>;
        const firstValuedItem = items.find(
          (item) =>
            (item.price && parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) > 0) ||
            (item.finalPrice ?? 0) > 0 ||
            (item.price_mxn_local ?? 0) > 0 ||
            (item.price_mxn_importation ?? 0) > 0
        );
        if (firstValuedItem) {
          return (
            firstValuedItem.finalPrice ||
            firstValuedItem.price_mxn_local ||
            firstValuedItem.price_mxn_importation ||
            parseFloat(String(firstValuedItem.price).replace(/[^0-9.-]+/g, '')) ||
            0
          );
        }
      }
    } catch (e) {
      logger.error('[fetchValuedPrice] search fallback failed', e);
    }
  }

  return 0;
}

