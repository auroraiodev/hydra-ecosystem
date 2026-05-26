'use client';

import { useEffect, useRef, useCallback, useReducer } from 'react';
import type { Socket } from 'socket.io-client';
import { useAppSelector } from '@/lib/store';
import { tokenStore } from '@/lib/utils/tokenStore';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import type { ChatMessage, UseChatSocketReturn } from '../types';

/** Plays a short notification ding via Web Audio API (no asset files). */
function playNotificationSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    // Ignore — browser may block audio before user interaction
  }
}

import { API_URL } from '@/lib/constants/api';

// WS connects to base URL (no /api prefix) — socket.io namespace is /chat
const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002').replace(/\/api$/, '');

interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  unreadCount: number;
}

type ChatAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INCREMENT_UNREAD' }
  | { type: 'CLEAR_UNREAD' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: state.messages.some((m) => m.id === action.payload.id)
          ? state.messages
          : [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'INCREMENT_UNREAD':
      return { ...state, unreadCount: state.unreadCount + 1 };
    case 'CLEAR_UNREAD':
      return { ...state, unreadCount: 0 };
    default:
      return state;
  }
}

export function useChatSocket(open: boolean): UseChatSocketReturn {
  const { token: reduxToken, isAuthenticated, user } = useAppSelector((s) => s.auth);
  const socketRef = useRef<Socket | null>(null);
  const [chatState, chatDispatch] = useReducer(chatReducer, {
    messages: [],
    isConnected: false,
    isLoading: false,
    unreadCount: 0,
  });
  const { messages, isConnected, isLoading, unreadCount } = chatState;
  const historyLoadedRef = useRef(false);
  const toast = useToastContext();
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Prefer in-memory tokenStore (survives re-renders), fallback to Redux
  const getToken = useCallback((): string | null => {
    return tokenStore.get() ?? reduxToken ?? null;
  }, [reduxToken]);

  // Load history from REST once per open session
  const loadHistory = useCallback(async () => {
    const token = getToken();
    if (!isAuthenticated || !token || historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    chatDispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(`${API_URL}/chat/history?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        // ResponseInterceptor wraps all responses: { success, data: [...] }
        const raw: Array<{
          id: string;
          user_id: string;
          content: string;
          sender: string;
          created_at: string;
        }> = Array.isArray(body) ? body : (body.data ?? []);
        chatDispatch({
          type: 'SET_MESSAGES',
          payload: raw.map((m) => ({
            id: m.id,
            userId: m.user_id,
            content: m.content,
            sender: m.sender as ChatMessage['sender'],
            createdAt: m.created_at,
          })),
        });
      }
    } catch (e) {
      console.error('[useChatSocket] history fetch error', e);
    } finally {
      chatDispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, getToken]);

  // Connect/disconnect purely based on authentication
  // oxlint-disable-next-line react-doctor/effect-needs-cleanup
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        chatDispatch({ type: 'SET_CONNECTED', payload: false });
      }
      return;
    }

    const token = getToken();
    if (!token) return;

    let cancelled = false;
    let effectSocket: Socket | null = null;

    void import('socket.io-client').then(({ io }) => {
      if (cancelled) return;

      const socket = io(`${WS_URL}/chat`, {
        auth: { token },
        transports: ['websocket'], // Use only websocket to avoid sid mismatches in polling across multiple backend instances
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
      });

      effectSocket = socket;
      socketRef.current = socket;

      socket.on('connect', () => {
        chatDispatch({ type: 'SET_CONNECTED', payload: true });
      });
      socket.on('disconnect', () => chatDispatch({ type: 'SET_CONNECTED', payload: false }));

      // Real-time cache invalidation for categories
      socket.on('invalidate_cache', (data: { type?: string; tcgId?: string }) => {
        if (!data?.type || data.type === 'categories') {
          // Dynamic import to avoid circular dependency or early loading
          import('@/lib/api/cache').then(({ clearCategoriesCache }) => {
            clearCategoriesCache(data?.tcgId);
          });
        }
      });
      socket.on('connect_error', (err) => console.error('[Chat] connect_error', err.message));

      socket.on('message', (msg: ChatMessage) => {
        chatDispatch({ type: 'ADD_MESSAGE', payload: msg });
        if (msg.sender === 'admin') {
          playNotificationSound();
          chatDispatch({ type: 'INCREMENT_UNREAD' });

          const handleChatOpen = () => {
            window.focus();
            window.dispatchEvent(new CustomEvent('open-hydra-chat'));
          };

          if (!openRef.current || document.hidden) {
            // 1. Web In-App Toaster
            toast.info(
              `Soporte Hydra: ${msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content}`,
              8000,
              handleChatOpen
            );

            // 2. Native OS Push Notification
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                const n = new Notification('Nuevo mensaje de Soporte Hydracollectables', {
                  body: msg.content,
                  icon: '/cat.png',
                });
                n.onclick = handleChatOpen;
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((p) => {
                  if (p === 'granted') {
                    const n = new Notification('Nuevo mensaje de Soporte Hydracollectables', {
                      body: msg.content,
                      icon: '/cat.png',
                    });
                    n.onclick = handleChatOpen;
                  }
                });
              }
            }
          }
        }
      });
    });

    return () => {
      cancelled = true;
      if (effectSocket) {
        effectSocket.removeAllListeners();
        effectSocket.disconnect();
      } else if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
      socketRef.current = null;
      chatDispatch({ type: 'SET_CONNECTED', payload: false });
      historyLoadedRef.current = false;
    };
    // Keep socket connected regardless of chat open state - only depends on auth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Load history when chat opens (only once per session)
  useEffect(() => {
    if (open && isAuthenticated && !historyLoadedRef.current) {
      loadHistory();
    }
  }, [open, isAuthenticated, loadHistory]);

  const sendMessage = useCallback((content: string) => {
    const s = socketRef.current;
    if (!s?.connected || !content.trim()) return;
    s.emit('send_message', { content: content.trim() });
  }, []);

  const clearUnread = useCallback(() => chatDispatch({ type: 'CLEAR_UNREAD' }), []);

  return { messages, sendMessage, isConnected, isLoading, unreadCount, clearUnread };
}
