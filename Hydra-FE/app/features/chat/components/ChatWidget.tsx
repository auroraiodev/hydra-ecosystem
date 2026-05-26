'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useChatSocket } from '@/features/chat';
import { usePushNotifications } from '@/features/notifications';
import { useAppSelector } from '@/lib/store';

import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageItem } from './MessageItem';

export function ChatWidget() {
  const { push } = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [atQuery, setAtQuery] = useState<string | null>(null);

  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { messages, sendMessage, isConnected, isLoading, unreadCount, clearUnread } =
    useChatSocket(open);

  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    loading: pushLoading,
  } = usePushNotifications();

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Fetch feature flag
  const { data: chatEnabled } = useQuery({
    queryKey: ['feature-flag', 'chat_enabled'],
    queryFn: async () => {
      const res = await fetch('/api/feature-flags');
      const json = await res.json();
      const flags: Array<{ key: string; enabled: boolean }> = json?.data ?? json ?? [];
      const flag = flags.find((f) => f.key === 'chat_enabled');
      return flag ? flag.enabled : true;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // clearUnread is called in openChat (line ~100) instead of via effect

  // Global event listener to open chat externally
  useEffect(() => {
    const handleOpenExternal = () => {
      if (!isAuthenticated) return;
      setOpen(true);
    };
    window.addEventListener('open-hydra-chat', handleOpenExternal);
    return () => window.removeEventListener('open-hydra-chat', handleOpenExternal);
  }, [isAuthenticated]);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const openChat = () => {
    if (!isAuthenticated) {
      push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
    clearUnread();
  };

  if (chatEnabled === false) return null;

  const isFloatingBarPage = ['/cart', '/wishlist', '/checkout'].includes(pathname);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(false);
          }
        }}
        role="button"
        tabIndex={open ? 0 : -1}
        aria-label={open ? 'Cerrar chat' : undefined}
      />

      {/* FAB */}
      <button
        id="chat-widget-fab"
        onClick={openChat}
        aria-label="Abrir chat con soporte"
        className={`fixed ${
          isFloatingBarPage ? 'bottom-60' : 'bottom-20'
        } right-5 sm:bottom-8 sm:right-8 z-50 size-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br from-teal to-teal/80 border border-white/20`}
        style={{
          boxShadow: '0 0 30px rgba(var(--glow-teal-rgb) / 0.4), inset 0 0 10px rgba(255,255,255,0.2)',
        }}
      >
        <MessageCircle className="size-6 text-white" />
        {unreadCount > 0 && !open && (
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        id="chat-widget-panel"
        className={`fixed z-[100] flex flex-col overflow-hidden transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)
          top-0 left-0 right-0 bottom-0 rounded-none bg-vault-bg
          sm:top-auto sm:left-auto sm:bottom-24 sm:right-8 sm:w-[420px] sm:h-[650px] sm:max-h-[calc(100vh-140px)] sm:rounded-3xl sm:origin-bottom-right
          vault-glass-panel
          ${
            open
              ? 'translate-y-0 opacity-100 pointer-events-auto sm:scale-100'
              : 'translate-y-full opacity-0 pointer-events-none sm:translate-y-4 sm:scale-95'
          }`}
        style={{
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <ChatHeader
          isConnected={isConnected}
          isAuthenticated={isAuthenticated}
          pushSupported={pushSupported}
          pushSubscribed={pushSubscribed}
          pushLoading={pushLoading}
          onPushToggle={async () => {
            if (pushSubscribed) await pushUnsubscribe();
            else await pushSubscribe();
          }}
          onClose={() => setOpen(false)}
        />

        {/* Body */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
            <div className="size-16 rounded-2xl flex items-center justify-center shadow-xl bg-teal/10 border border-teal/20">
              <MessageCircle className="size-8 text-teal" />
            </div>
            <div>
              <p className="text-white font-semibold text-base mb-1">Inicia sesión para chatear</p>
              <p className="text-vault-text-muted text-sm leading-relaxed">
                Necesitas una cuenta para hablar con el equipo de soporte.
              </p>
            </div>
            <Link
              href="/login"
              className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg bg-teal shadow-teal/20"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div
              ref={messagesRef}
              className="flex-1 overflow-y-auto px-5 py-6 gap-y-4 bg-black/20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent relative"
              style={{ minHeight: 0, overscrollBehavior: 'contain' }}
            >
              {/* Internal glow for messages */}
              <div className="absolute top-0 right-0 size-[250px] bg-teal/5 rounded-full blur-[100px] pointer-events-none" />
              {messages.length === 0 && !isLoading && (
                <div className="flex gap-2.5">
                  <div className="size-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white mt-0.5 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.3)] bg-teal">
                    H
                  </div>
                  <div className="vault-glass-card rounded-2xl rounded-tl-sm px-4 py-3 max-w-[82%] border border-white/10 shadow-lg">
                    <p className="text-white/90 text-sm leading-relaxed">
                      Hola {user?.first_name ?? ''}! ¿En qué podemos ayudarte hoy?
                    </p>
                    <p className="text-white/30 text-[10px] mt-1.5 text-right">Ahora</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center py-6">
                  <div className="flex items-center gap-2 text-white/20 text-sm">
                    <div className="size-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                    Cargando mensajesâ€¦
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  id={msg.id}
                  sender={msg.sender}
                  content={msg.content}
                  createdAt={msg.createdAt}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <ChatInput
              input={input}
              setInput={setInput}
              atQuery={atQuery}
              setAtQuery={setAtQuery}
              isConnected={isConnected}
              onSendMessage={sendMessage}
            />
          </>
        )}
      </div>
    </>
  );
}
