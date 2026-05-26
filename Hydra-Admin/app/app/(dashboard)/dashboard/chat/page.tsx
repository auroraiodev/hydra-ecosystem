'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useChatAdmin } from '@/hooks/useChatAdmin';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { ChatSidebar, ChatThread, ChatInput } from './components';

export default function AdminChatPage() {
  const {
    conversations,
    activeUserId,
    activeMessages,
    setActiveUserId,
    sendMessage,
    deleteMessage,
    deleteConversation,
    isConnected,
    isLoading,
  } = useChatAdmin();

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
    [conversations]
  );

  // Keep sidebar unread badge perfectly synced with actual conversation state
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('chat:unread-update', { detail: totalUnread }));
  }, [totalUnread]);

  // Mobile: 'list' shows conversations, 'chat' shows active thread
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Handle incoming ?user= ID from push notifications or toasts
  const handleUrlUserId = useCallback(() => {
    const search = new URLSearchParams(window.location.search);
    const user = search.get('user');
    if (user) {
      setActiveUserId(user);
      setMobileView('chat');
      window.history.replaceState({}, '', '/dashboard/chat');
    }
  }, [setActiveUserId]);

  useEffect(() => {
    handleUrlUserId();
  }, [handleUrlUserId]);

  const { supported: pushSupported, subscribed, subscribe, unsubscribe } = usePushNotifications();

  const handleBack = () => {
    setMobileView('list');
    setActiveUserId(null);
  };

  const handlePushToggle = async () => {
    if (subscribed) {
      await unsubscribe();
      toast.success('Notificaciones desactivadas');
    } else {
      const ok = await subscribe();
      if (ok) toast.success('Notificaciones activadas');
      else toast.error('No se pudo activar las notificaciones');
    }
  };

  const activeConvo = conversations.find((c) => c.userId === activeUserId);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] md:h-screen overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeUserId={activeUserId}
        setActiveUserId={setActiveUserId}
        setMobileView={setMobileView}
        totalUnread={totalUnread}
        pushSupported={pushSupported}
        subscribed={subscribed}
        onPushToggle={handlePushToggle}
        isConnected={isConnected}
        mobileView={mobileView}
      />

      <ChatThread
        activeUserId={activeUserId}
        activeMessages={activeMessages}
        activeConvo={activeConvo}
        isLoading={isLoading}
        onBack={handleBack}
        onDeleteConversation={deleteConversation}
        onDeleteMessage={deleteMessage}
        mobileView={mobileView}
      >
        <ChatInput
          onSendMessage={(content) => activeUserId && sendMessage(activeUserId, content)}
          isConnected={isConnected}
          activeUserId={activeUserId}
        />
      </ChatThread>
    </div>
  );
}
