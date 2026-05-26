'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function getWsUrl(): string {
  if (typeof window === 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002').replace(/\/api$/, '');
  }

  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3002`;
  }

  const wsProtocol = protocol === 'https:' ? 'https:' : 'http:';

  if (hostname.endsWith('hydracollect.com')) {
    if (hostname.startsWith('qa.')) {
      return `${wsProtocol}//qa-api.hydracollect.com`;
    }
    return `${wsProtocol}//api.hydracollect.com`;
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/api$/, '');
  }

  return window.location.origin;
}

async function getWsToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/ws-token');
    if (res.ok) {
      const json = await res.json();
      return json.token ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchInitialUnreadCount(): Promise<number> {
  try {
    const r = await fetch('/api/proxy/chat/conversations');
    if (!r.ok) return 0;
    const json = await r.json();
    const convos: Array<{ unreadCount: number }> = json?.data ?? json ?? [];
    return convos.reduce((s, c) => s + (c.unreadCount ?? 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Lightweight hook that maintains total unread chat message count for the sidebar badge.
 * Connects to the WebSocket to get real-time increments; initial count comes from REST.
 */
export function useChatUnreadCount(): number {
  const [count, setCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial total unread from conversations list
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const initialCount = await fetchInitialUnreadCount();
      if (mounted) setCount(initialCount);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  // WebSocket: increment count on new_user_message
  useEffect(() => {
    let socket: Socket;

    const connect = async () => {
      const token = await getWsToken();
      if (!token) return;

      socket = io(`${getWsUrl()}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('new_user_message', () => {
        setCount((c) => c + 1);
      });

      // Listen for exact unread counts pushed by the chat page itself (so they stay perfectly synced)
      if (typeof window !== 'undefined') {
        const handleUpdate = (e: CustomEvent<number>) => setCount(e.detail);
        window.addEventListener('chat:unread-update', handleUpdate as EventListener);
        socket.on('disconnect', () => {
          window.removeEventListener('chat:unread-update', handleUpdate as EventListener);
        });

        // Store for cleanup
        (socket as Socket & { _updateHandler: (e: CustomEvent<number>) => void })._updateHandler = handleUpdate;
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        const handler = (socketRef.current as Socket & { _updateHandler?: (e: CustomEvent<number>) => void })._updateHandler;
        if (handler) {
          window.removeEventListener('chat:unread-update', handler as EventListener);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return count;
}
