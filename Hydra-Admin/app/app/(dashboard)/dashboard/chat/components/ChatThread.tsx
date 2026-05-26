'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Person24Regular,
  ArrowLeft24Regular,
  Delete24Regular,
  SpinnerIos20Regular,
  Chat24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { ClientDate } from '@/components/ClientDate';
import { MessageContent } from './MessageContent';

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  sender: 'user' | 'admin';
  createdAt: string;
}

interface ChatConversation {
  userId: string;
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface ChatThreadProps {
  activeUserId: string | null;
  activeMessages: ChatMessage[];
  activeConvo?: ChatConversation;
  isLoading: boolean;
  onBack: () => void;
  onDeleteConversation: (userId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  mobileView: 'list' | 'chat';
  children: React.ReactNode; // For ChatInput
}

export function ChatThread({
  activeUserId,
  activeMessages,
  activeConvo,
  isLoading,
  onBack,
  onDeleteConversation,
  onDeleteMessage,
  mobileView,
  children,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (!activeUserId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 p-8 bg-card">
        <div className="size-20 rounded-2xl bg-muted/20 flex items-center justify-center">
          <Chat24Regular className="size-10 opacity-15" />
        </div>
        <div className="text-center">
          <p className="font-medium mb-1">Selecciona una conversación</p>
          <p className="text-sm opacity-60">Elige un cliente del panel izquierdo para responder.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex-1 flex flex-col min-w-0 bg-card',
        mobileView === 'chat' ? 'flex' : 'hidden md:flex'
      )}
    >
      {/* Chat header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0 bg-card/80 backdrop-blur-sm z-10">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-muted/60 active:bg-muted transition-colors text-muted-foreground cursor-pointer"
          aria-label="Volver"
        >
          <ArrowLeft24Regular className="size-5" />
        </button>
        <div className="relative shrink-0">
          <Avatar className="size-9 border border-background shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {activeConvo?.userName ? (
                activeConvo.userName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              ) : (
                <Person24Regular className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
          {activeConvo?.isOnline && (
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate leading-tight">
            {activeConvo?.userName || activeConvo?.userEmail || 'Usuario'}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {activeConvo?.isOnline ? (
              <span className="text-green-500">En línea</span>
            ) : activeConvo?.userEmail ? (
              activeConvo.userEmail
            ) : (
              'Desconectado'
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
          onClick={() => {
            if (
              confirm(
                '¿Estás seguro de borrar toda la conversación? Esta acción eliminará permanentemente todos los mensajes asociados con este usuario y no se puede deshacer.'
              )
            ) {
              onDeleteConversation(activeUserId);
            }
          }}
          title="Borrar conversación completa"
        >
          <Delete24Regular className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <SpinnerIos20Regular className="size-4 animate-spin" />
                Cargando mensajes…
              </div>
            </div>
          )}
          {!isLoading && activeMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Chat24Regular className="size-10 opacity-15 mb-3" />
              <p className="text-sm">Sin mensajes todavía</p>
            </div>
          )}
          {activeMessages.map((msg) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div
                key={msg.id}
                className={cn('flex gap-2.5 group', isAdmin ? 'justify-end' : 'justify-start')}
              >
                {!isAdmin && (
                  <Avatar className="size-8 shrink-0 mt-0.5 border border-background shadow-sm">
                    <AvatarFallback className="text-xs bg-muted font-medium">
                      {activeConvo?.userName ? activeConvo.userName[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}

                {isAdmin && (
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer self-center transition-all"
                    title="Borrar mensaje"
                    onClick={() => {
                      if (confirm('¿Borrar este mensaje permanentemente?')) onDeleteMessage(msg.id);
                    }}
                  >
                    <Delete24Regular className="size-4" />
                  </button>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 max-w-[85%] md:max-w-[70%] shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
                    isAdmin
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/60 border border-muted rounded-tl-sm text-foreground'
                  )}
                >
                  <div className="text-sm leading-relaxed">
                    <MessageContent content={msg.content} />
                  </div>
                  <ClientDate
                    date={msg.createdAt}
                    formatter={(d) =>
                      d.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    }
                  />
                </div>

                {!isAdmin && (
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer self-center transition-all"
                    title="Borrar mensaje"
                    onClick={() => {
                      if (confirm('¿Borrar este mensaje permanentemente?')) onDeleteMessage(msg.id);
                    }}
                  >
                    <Delete24Regular className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input section */}
      {children}
    </div>
  );
}
