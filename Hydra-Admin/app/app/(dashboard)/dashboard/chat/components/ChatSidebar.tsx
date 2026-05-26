'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Chat24Regular,
  Alert24Regular,
  AlertOff24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientDate } from '@/components/ClientDate';

interface ChatConversation {
  userId: string;
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeUserId: string | null;
  setActiveUserId: (id: string | null) => void;
  setMobileView: (view: 'list' | 'chat') => void;
  totalUnread: number;
  pushSupported: boolean;
  subscribed: boolean;
  onPushToggle: () => void;
  isConnected: boolean;
  mobileView: 'list' | 'chat';
}

export function ChatSidebar({
  conversations,
  activeUserId,
  setActiveUserId,
  setMobileView,
  totalUnread,
  pushSupported,
  subscribed,
  onPushToggle,
  isConnected,
  mobileView,
}: ChatSidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col bg-muted/10 border-r',
        // Mobile: full width, visible only when mobileView === 'list'
        'w-full md:w-80 md:shrink-0 md:flex',
        mobileView === 'list' ? 'flex' : 'hidden md:flex'
      )}
    >
      {/* Sidebar header */}
      <div className="p-4 border-b flex items-center justify-between bg-card shrink-0 gap-2">
        <h2 className="font-semibold flex items-center gap-2 min-w-0">
          <Chat24Regular className="size-5 text-primary shrink-0" />
          <span className="truncate">Soporte</span>
          {totalUnread > 0 && (
            <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {pushSupported && (
            <button
              onClick={onPushToggle}
              title={subscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              className={cn(
                'p-2 rounded-full transition-colors cursor-pointer',
                subscribed
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {subscribed ? (
                <Alert24Regular className="size-4" />
              ) : (
                <AlertOff24Regular className="size-4" />
              )}
            </button>
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
              isConnected ? 'text-green-600 bg-green-500/10' : 'text-muted-foreground bg-muted/50'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
            />
            <span className="hidden sm:inline">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
            <div className="size-14 rounded-full bg-muted/30 flex items-center justify-center">
              <People24Regular className="size-7 opacity-30" />
            </div>
            <div>
              <p className="font-medium mb-0.5">Sin conversaciones</p>
              <p className="text-xs opacity-60">Los mensajes de clientes aparecerán aquí.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {conversations.map((c) => {
              const isActive = c.userId === activeUserId;
              const initials = c.userName
                ? c.userName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : '?';
              return (
                <button
                  key={c.userId}
                  onClick={() => {
                    setActiveUserId(c.userId);
                    setMobileView('chat');
                  }}
                  className={cn(
                    'w-full text-left p-4 transition-colors flex items-start gap-3 relative overflow-hidden cursor-pointer',
                    'active:bg-muted/60',
                    isActive ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/40'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full" />
                  )}
                  <div className="relative shrink-0">
                    <Avatar className="size-11 border-2 border-background shadow-sm">
                      <AvatarFallback
                        className={cn(
                          'text-sm font-semibold',
                          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {c.isOnline && (
                      <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-green-500 border-2 border-background shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={cn(
                          'text-sm truncate pr-2',
                          c.unreadCount > 0 ? 'font-semibold' : 'font-medium'
                        )}
                      >
                        {c.userName || c.userEmail}
                      </span>
                      {c.lastMessageAt && (
                        <ClientDate
                          date={c.lastMessageAt}
                          formatter={(d) =>
                            isToday(d) ? format(d, 'HH:mm') : format(d, 'dd MMM', { locale: es })
                          }
                        />
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-xs line-clamp-1 break-words',
                        c.unreadCount > 0 ? 'text-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {c.lastMessage || <span className="italic opacity-50">Sin mensajes</span>}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm mt-0.5">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
