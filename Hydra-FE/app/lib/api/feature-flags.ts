import { API_URL } from '../constants/api';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  label: string;
}

async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_URL}/feature-flags`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];
    const json = await response.json();
    const flags = Array.isArray(json) ? json : (json?.data ?? []);
    return flags as FeatureFlag[];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Feature Flags] Fetch timed out. Assuming maintenance is not active.');
    } else {
      console.error('Error fetching feature flags:', error);
    }
    return [];
  }
}

export async function isMaintenanceModeActive(): Promise<boolean> {
  try {
    const flags = await getFeatureFlags();

    // If we can't get flags, do NOT block the site.
    // Defaulting to active maintenance mode locks the site whenever the backend is down,
    // which is usually worse than letting a partially broken site load.
    if (!flags || flags.length === 0) {
      console.warn(
        '[Maintenance Check] No flags received. Assuming maintenance is NOT active to prevent lockout.'
      );
      return false;
    }

    const maintenanceFlag = flags.find((f) => f.key === 'maintenance_mode');
    const isActive = maintenanceFlag?.enabled ?? false;

    console.log(`[Maintenance Check] Active: ${isActive}, Total flags: ${flags.length}`);
    return isActive;
  } catch (err) {
    console.error('[Maintenance Check] Critical Error during fetch:', err);
    // Fail safe to NOT active to avoid locking out the user
    return false;
  }
}
