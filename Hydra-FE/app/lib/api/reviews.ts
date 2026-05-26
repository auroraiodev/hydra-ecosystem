import { API_URL } from '../constants/api';
import { logger } from '../utils/logger';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  user: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

/**
 * Fetch approved reviews for the home page.
 */
export async function getApprovedReviews(): Promise<Review[]> {
  const url = `${API_URL}/reviews`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      logger.error(`[reviews/getApprovedReviews] HTTP error! status: ${response.status}`, { url });
      return [];
    }

    const json = await response.json();
    return json.data || json || [];
  } catch (err) {
    // Downgrade to warn — ECONNREFUSED is expected in dev/build when backend isn't running
    logger.warn('[reviews/getApprovedReviews] Fetch failed', { error: err });
    return [];
  }
}

/**
 * Submit a new review (Authenticated).
 */
export async function submitReview(
  data: {
    rating: number;
    comment: string;
    order_id?: string;
  },
  token: string
): Promise<{ success: boolean; message?: string }> {
  const url = `${API_URL}/reviews`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let message = 'Error submitting review';
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorJson = await response.json().catch(() => null as unknown);
          if (errorJson && typeof errorJson === 'object') {
            const errObj = errorJson as Record<string, unknown>;
            message = (errObj.message as string) || (errObj.error as string) || message;
          }
        } else {
          const text = await response.text();
          if (text) {
            message = text;
          }
        }
      } catch (parseError) {
        logger.error('[reviews/submitReview] Failed to parse error response', {
          error: parseError,
        });
      }
      return { success: false, message };
    }

    return { success: true };
  } catch (err) {
    logger.error('[reviews/submitReview] Submission failed', { error: err });
    return { success: false, message: 'Network error' };
  }
}
