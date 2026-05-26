'use client';

import * as React from 'react';
import {
  Alert24Regular,
  Box24Regular,
  Wallet24Regular,
  Info24Regular,
  AlertUrgent24Regular,
} from '@fluentui/react-icons';
import {
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Button,
  Badge,
  Divider,
} from '@fluentui/react-components';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
      case 'ORDER_STATUS':
        return <Box24Regular className="size-5 text-blue-500" />;
      case 'WITHDRAW_REQUEST':
      case 'WALLET_TX':
        return <Wallet24Regular className="size-5 text-green-500" />;
      case 'ADMIN_ALERT':
        return <AlertUrgent24Regular className="size-5 text-orange-500" />;
      default:
        return <Info24Regular className="size-5 text-zinc-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)} positioning="below-end">
      <PopoverTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          icon={<Alert24Regular className="text-sidebar-foreground" />}
          className="relative size-9 rounded-full"
          aria-label="Notificaciones"
        >
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-4 transform translate-x-1/2 -translate-y-1/2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-4 bg-red-500 text-[10px] items-center justify-center text-white font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverSurface className="p-0 overflow-hidden w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-xl border border-border bg-background shadow-2xl z-[100]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:underline font-medium"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground italic">Cargando…</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Alert24Regular className="size-8 mx-auto mb-2 opacity-20" />
              <p>No tienes notificaciones por ahora</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'p-4 transition-colors hover:bg-muted/50 cursor-pointer flex gap-3 relative',
                    !notification.is_read && 'bg-primary/5'
                  )}
                  onClick={() => {
                    markAsRead(notification.id);
                    setIsOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      markAsRead(notification.id);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="mt-1 shrink-0">
                    <div className="size-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm leading-none font-medium',
                          !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        <ClientDate
                          date={notification.created_at}
                          formatter={(d) =>
                            formatDistanceToNow(d, { addSuffix: true, locale: es })
                          }
                        />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    {typeof notification.data?.orderId === 'string' && (
                      <div className="pt-1">
                        <Badge appearance="outline" className="text-[10px] h-4">
                          #{(notification.data.orderId as string).substring(0, 8)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {!notification.is_read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 size-1.5 bg-primary rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />
        <div className="p-2">
          <Button appearance="subtle" className="w-full text-xs justify-center h-8" disabled>
            Ver historial completo
          </Button>
        </div>
      </PopoverSurface>
    </Popover>
  );
}
