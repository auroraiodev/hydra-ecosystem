import { API_URL } from '@/lib/constants/api';

export async function hasSeenModal(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/modal/seen`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If unauthorized or error, default to not showing modal
      return true;
    }

    const data = await response.json();
    return data.seen || data.data?.seen || false;
  } catch (error) {
    console.error('Failed to check modal seen status:', error);
    // On error, default to not showing modal (fail gracefully)
    return true;
  }
}

export async function markModalAsSeen(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/modal/mark-seen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Failed to mark modal as seen:', error);
    // Silent fail - don't block user
  }
}
