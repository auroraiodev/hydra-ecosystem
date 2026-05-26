'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    // Using a microtask to avoid synchronous setState warning
    queueMicrotask(() => {
      setSupported(ok);
      if (ok) setPermission(Notification.permission);
    });
  }, []);

  // Register SW once on mount
  useEffect(() => {
    if (!supported) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registrationRef.current = reg;
        return reg.pushManager.getSubscription();
      })
      .then((existing) => {
        setSubscribed(!!existing);
      })
      .catch((err) => console.error('[SW] register error', err));
  }, [supported]);

  const subscribe = async (): Promise<boolean> => {
    if (!supported) return false;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') {
      if (perm === 'denied') {
        toast.error('Notificaciones bloqueadas', {
          description:
            'Habilita las notificaciones en el icono del candado en la barra de tu navegador superior.',
          duration: 8000,
        });
      }
      return false;
    }

    try {
      // Fetch VAPID public key from backend via proxy
      // ResponseInterceptor wraps response: { success, data: { key } }
      const keyRes = await fetch('/api/proxy/chat/push/vapid-public-key');
      if (!keyRes.ok) return false;
      const keyJson = await keyRes.json();
      const key = keyJson?.data?.key ?? keyJson?.key;
      if (!key) {
        toast.error('Error del servidor', {
          description:
            'Falta la configuración de VAPID keys en el entorno de producción del backend.',
          duration: 8000,
        });
        return false;
      }

      let reg =
        registrationRef.current ?? (await navigator.serviceWorker.getRegistration()) ?? null;
      if (!reg) {
        reg = (await navigator.serviceWorker.register('/sw.js')) ?? null;
      }
      if (!reg) {
        toast.error('Error', {
          description: 'No se pudo iniciar el servicio de notificaciones en este navegador.',
        });
        return false;
      }
      registrationRef.current = reg;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
      });

      const json = sub.toJSON();
      await fetch('/api/proxy/chat/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('[Push] subscribe error', err);
      return false;
    }
  };

  const unsubscribe = async (): Promise<void> => {
    try {
      const reg =
        registrationRef.current ?? (await navigator.serviceWorker.getRegistration()) ?? null;
      if (!reg) return;

      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      await fetch('/api/proxy/chat/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });

      await sub.unsubscribe();
      setSubscribed(false);
    } catch (e) {
      console.error('[Push] unsubscribe error', e);
    }
  };

  return { supported, permission, subscribed, subscribe, unsubscribe };
}
