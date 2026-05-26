'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '@/lib/store';
import { tokenStore } from '@/lib/utils/tokenStore';
import type { UsePushNotificationsReturn } from '../types';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

import { API_URL } from '@/lib/constants/api';

export function usePushNotifications(): UsePushNotificationsReturn {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const reduxToken = useAppSelector((s) => s.auth.token);

  const getToken = useCallback((): string | null => {
    return tokenStore.get() ?? reduxToken ?? null;
  }, [reduxToken]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    void Promise.resolve().then(() => {
      setSupported(ok);
      if (ok) setPermission(Notification.permission);
    });
  }, []);

  // Register SW once on mount
  useEffect(() => {
    if (!supported || !isAuthenticated) return;

    navigator.serviceWorker
      .register('/push-sw.js')
      .then((reg) => {
        registrationRef.current = reg;
        return reg.pushManager.getSubscription();
      })
      .then((existing) => {
        setSubscribed(!!existing);
      })
      .catch((err) => console.error('[SW] register error', err));

    // Listen for messages from service worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_CHAT') {
        window.dispatchEvent(new CustomEvent('open-hydra-chat'));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, [supported, isAuthenticated]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || !isAuthenticated) return false;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return false;
      }

      const token = getToken();
      if (!token) {
        setLoading(false);
        return false;
      }

      // Fetch VAPID public key from backend
      const keyRes = await fetch(`${API_URL}/chat/push/vapid-public-key`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!keyRes.ok) {
        console.error('[Push] Failed to get VAPID key');
        setLoading(false);
        return false;
      }

      const keyJson = await keyRes.json();
      const key = keyJson?.data?.key ?? keyJson?.key;

      if (!key) {
        console.error('[Push] VAPID key not configured on server');
        setLoading(false);
        return false;
      }

      let reg =
        registrationRef.current ??
        (await navigator.serviceWorker.getRegistration('/push-sw.js')) ??
        null;
      if (!reg) {
        reg = await navigator.serviceWorker.register('/push-sw.js');
      }
      if (!reg) {
        setLoading(false);
        return false;
      }
      registrationRef.current = reg;

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
      });

      const json = sub.toJSON();

      // Send subscription to backend
      await fetch(`${API_URL}/chat/push/subscribe/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });

      setSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('[Push] subscribe error', err);
      setLoading(false);
      return false;
    }
  }, [supported, isAuthenticated, getToken]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;
    setLoading(true);

    try {
      const token = getToken();
      const reg =
        registrationRef.current ??
        (await navigator.serviceWorker.getRegistration('/push-sw.js')) ??
        null;
      if (!reg) {
        setLoading(false);
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setLoading(false);
        return;
      }

      if (token) {
        await fetch(`${API_URL}/chat/push/unsubscribe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }

      await sub.unsubscribe();
      setSubscribed(false);
    } catch (e) {
      console.error('[Push] unsubscribe error', e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getToken]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
