'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/store';
import { tokenStore } from '@/lib/utils/tokenStore';

function getWsUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3002';
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return `http://${hostname}:3002`;
  const wsProtocol = protocol === 'https:' ? 'https:' : 'http:';
  if (hostname.endsWith('hydracollect.com')) return `${wsProtocol}//${hostname}`;
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl?.startsWith('http')) return envUrl.replace(/\/api$/, '');
  return window.location.origin;
}

export function usePresence() {
  const socketRef = useRef<ReturnType<typeof import('socket.io-client')['io']> | null>(null);
  const pathname = usePathname();
  const isAuthenticated = useAppSelector((s: any) => s.auth?.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = tokenStore.getToken();
    if (!token) return;

    let socket: ReturnType<typeof import('socket.io-client')['io']>;

    import('socket.io-client').then(({ io }) => {
      socket = io(`${getWsUrl()}/presence`, {
        auth: { token },
        query: { page: pathname },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('ip_blocked', () => {
        socket.disconnect();
        window.location.replace('/maintenance');
      });
    });

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
    // Only re-run on auth change, not pathname (page_change handles route updates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Emit page_change whenever route changes after connected
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    // Use a small timeout to ensure socket is connected before emitting
    const t = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('page_change', { page: pathname });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [pathname]);
}
