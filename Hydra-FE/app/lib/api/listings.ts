import { API_URL } from '../constants/api';
import { store } from '@/lib/store';
import { logger } from '../utils/logger';
import { MyListingsResponseSchema, type Listing } from '../validations/listing';
export type { Listing };

function getAuthHeader() {
  const state = store.getState();
  const token = state.auth.token;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getMyListings(
  page: number = 1,
  limit: number = 20
): Promise<{
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const response = await fetch(`${API_URL}/listings/my-listings?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    logger.error('[listings/getMyListings] HTTP error', { status: response.status });
    throw new Error('Failed to fetch listings');
  }

  const result = await response.json();
  const actualData = result.success !== undefined ? result.data : result;

  // Validation
  const validation = MyListingsResponseSchema.safeParse(actualData);
  if (!validation.success) {
    logger.error('[listings/getMyListings] Validation failed', {
      errors: validation.error.format(),
      data: actualData,
    });
  }

  const listingsArray = Array.isArray(actualData.data)
    ? actualData.data
    : Array.isArray(actualData)
      ? actualData
      : [];

  // Use backend earnings or calculate fallback (90% of discounted price)
  const listingsWithEarnings = listingsArray.map((listing: Listing) => {
    const basePrice = parseFloat(listing.singles?.price || '0');
    const discount = listing.singles?.conditions?.discount || 0;
    const discountedPrice = basePrice * (1 - discount / 100);

    return {
      ...listing,
      earnings: listing.earnings || discountedPrice * 0.9,
    };
  });

  return {
    ...actualData,
    data: listingsWithEarnings,
  };
}
