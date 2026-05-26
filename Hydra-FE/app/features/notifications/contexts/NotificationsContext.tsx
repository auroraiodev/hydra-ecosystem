'use client';

import * as React from 'react';
import { createContext, useEffect, useCallback, useRef, useReducer } from 'react';
import { api, type Notification } from '@/lib/api/client';
import { useAppSelector } from '@/lib/store';
import { useToast } from '@/features/shared';

const POLL_INTERVAL = 30000;

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

type NotifAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'RESET' };

function notifReducer(state: NotifState, action: NotifAction): NotifState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.is_read).length,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      };
    case 'RESET':
      return { notifications: [], unreadCount: 0, isLoading: false };
    default:
      return state;
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifState, notifDispatch] = useReducer(notifReducer, {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  });
  const { notifications, unreadCount, isLoading } = notifState;
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { info } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    notifDispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        notifDispatch({ type: 'SET_NOTIFICATIONS', payload: data });
      } else {
        notifDispatch({ type: 'RESET' });
      }
    } catch (error) {
      console.error('[useNotifications] Error fetching notifications:', error);
    } finally {
      notifDispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      notifDispatch({ type: 'MARK_READ', payload: id });
    } catch (error) {
      console.error('[useNotifications] Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      notifDispatch({ type: 'MARK_ALL_READ' });
    } catch (error) {
      console.error('[useNotifications] Error marking all as read:', error);
    }
  };

  const fetchNotificationsRef = useRef(fetchNotifications);
  const infoRef = useRef(info);

  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    infoRef.current = info;
  }, [info]);

  // Poll for notifications instead of Supabase Realtime
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (!isAuthenticated) {
        void Promise.resolve().then(() => notifDispatch({ type: 'RESET' }));
      }
      return;
    }

    fetchNotificationsRef.current();

    const interval = setInterval(() => {
      fetchNotificationsRef.current();
    }, POLL_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, user?.id]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = React.use(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used inside NotificationsProvider');
  return ctx;
}
