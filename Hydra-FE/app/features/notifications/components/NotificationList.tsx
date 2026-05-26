'use client';

import { Bell, Clock } from 'lucide-react';
import Link from 'next/link';
import { TimeAgo } from '@/features/shared/components/TimeAgo';
import type { Notification, NotificationListProps } from '../types';

export function NotificationList({
  notifications,
  isLoading,
  markAsRead,
  getIcon,
}: NotificationListProps) {
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full size-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-zinc-500">Cargando…</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-zinc-100 rounded-full size-12 flex items-center justify-center mx-auto mb-3">
          <Bell className="size-6 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-900">No hay notificaciones</p>
        <p className="text-xs text-zinc-500 mt-1">Te avisaremos cuando pase algo importante.</p>
      </div>
    );
  }

  const handleNotificationKeyDown = (e: React.KeyboardEvent, notification: Notification) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNotificationClick(notification);
    }
  };

  return (
    <div className="divide-y divide-zinc-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          onKeyDown={(e) => handleNotificationKeyDown(e, notification)}
          role="button"
          tabIndex={0}
          className={`px-4 py-4 hover:bg-zinc-50 transition-colors cursor-pointer flex gap-3 relative ${
            !notification.is_read ? 'bg-primary/5' : ''
          }`}
        >
          {!notification.is_read && (
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
          )}

          <div
            className={`flex-shrink-0 size-10 rounded-full flex items-center justify-center ${
              !notification.is_read ? 'bg-white shadow-sm' : 'bg-zinc-100'
            }`}
          >
            {getIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <p
                className={`text-sm font-semibold truncate ${
                  !notification.is_read ? 'text-zinc-900' : 'text-zinc-700'
                }`}
              >
                {notification.title}
              </p>
              <span
                className="text-[10px] text-zinc-400 flex items-center whitespace-nowrap ml-2"
                suppressHydrationWarning
              >
                <Clock className="size-3 mr-1" />
                <TimeAgo date={notification.created_at} />
              </span>
            </div>
            <p
              className={`text-xs line-clamp-2 leading-relaxed ${
                !notification.is_read ? 'text-zinc-700' : 'text-zinc-500'
              }`}
            >
              {notification.message}
            </p>

            {!!(notification.data as Record<string, unknown>)?.orderId && (
              <Link
                href={`/profile/orders/${String((notification.data as Record<string, unknown>).orderId)}`}
                className="mt-2 text-[10px] font-bold text-primary hover:underline inline-block uppercase tracking-wider"
                onClick={(e) => e.stopPropagation()}
              >
                Ver Pedido
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
