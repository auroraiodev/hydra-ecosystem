'use client';

import { usePresence } from '@/hooks/usePresence';

export function PresenceWatcher() {
  usePresence();
  return null;
}
