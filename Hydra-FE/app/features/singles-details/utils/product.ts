import { getProduct } from '@/lib/api';

export async function fetchProductData(id: string, cardName?: string, language?: string) {
  try {
    let realId = id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isUuid && id.includes('-')) {
      const uuidMatch = id.match(
        /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
      );
      if (uuidMatch) {
        realId = uuidMatch[1];
      } else {
        const numericMatch = id.match(/^(\d+)-/);
        if (numericMatch) {
          realId = numericMatch[1];
        }
      }
    }

    return await getProduct(realId, cardName, language);
  } catch (error) {
    if (error instanceof Error && error.message !== 'Producto no encontrado') {
      console.error('Error fetching product:', error);
    }
    return null;
  }
}

export const getPriceValidUntil = () => {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0];
};

export const mapConditionToSchema = (conditionName?: string) => {
  const name = conditionName?.toUpperCase() || '';
  if (name.includes('M/NM') || name.includes('MINT') || name.includes('NEAR MINT')) {
    return 'https://schema.org/NewCondition';
  }
  if (name.includes('D') || name.includes('DAMAGED')) {
    return 'https://schema.org/DamagedCondition';
  }
  return 'https://schema.org/UsedCondition';
};
