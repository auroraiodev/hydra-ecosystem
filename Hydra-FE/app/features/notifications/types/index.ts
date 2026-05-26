import React from 'react';

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

export interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  markAsRead: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
}

export interface UsePushNotificationsReturn {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
}
