'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { notificationsAPI } from '@/lib/api';
import { useAuth } from './use-auth';

const POLL_INTERVAL = 30000;

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    startTransition(async () => {
      try {
        const data = await notificationsAPI.list();
        const notificationsArray = Array.isArray(data) ? data : data?.notifications || [];
        setNotifications(notificationsArray);
        setUnreadCount(notificationsArray.filter((n: Notification) => !n.is_read).length);
      } catch {
        // silent — stale data is better than a noisy error
      }
    });
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

  useEffect(() => {
    if (!user?.id) return;

    fetchNotificationsRef.current();

    const interval = setInterval(() => {
      fetchNotificationsRef.current();
    }, POLL_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading: isPending,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
