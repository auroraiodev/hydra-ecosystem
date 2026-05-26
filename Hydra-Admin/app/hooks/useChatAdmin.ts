import { useEffect, useRef, useReducer, useCallback, useTransition, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

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
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // Ignore — browser may block audio before user interaction
  }
}

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

interface ChatState {
  conversations: ChatConversation[];
  activeUserId: string | null;
  activeMessages: ChatMessage[];
  isConnected: boolean;
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; conversations: ChatConversation[] }
  | { type: 'SET_ACTIVE_USER_ID'; userId: string | null }
  | { type: 'SET_ACTIVE_MESSAGES'; messages: ChatMessage[] }
  | { type: 'SET_CONNECTED'; isConnected: boolean }
  | { type: 'NEW_USER_MESSAGE'; message: ChatMessage; currentActiveUserId: string | null }
  | { type: 'MESSAGE_SENT'; message: ChatMessage; currentActiveUserId: string | null }
  | { type: 'USER_ONLINE'; userId: string; userName: string; userEmail: string }
  | { type: 'USER_OFFLINE'; userId: string }
  | { type: 'MARK_READ'; userId: string }
  | { type: 'REMOVE_MESSAGE'; messageId: string }
  | { type: 'REMOVE_CONVERSATION'; userId: string };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.conversations };
    case 'SET_ACTIVE_USER_ID':
      return { ...state, activeUserId: action.userId };
    case 'SET_ACTIVE_MESSAGES':
      return { ...state, activeMessages: action.messages };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.isConnected };
    case 'NEW_USER_MESSAGE': {
      const msg = action.message;
      const conversations = [...state.conversations];
      const idx = conversations.findIndex((c) => c.userId === msg.userId);
      if (idx >= 0) {
        const convo = {
          ...conversations[idx],
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount:
            conversations[idx].unreadCount + (msg.userId === action.currentActiveUserId ? 0 : 1),
        };
        conversations.splice(idx, 1);
        conversations.unshift(convo);
      }
      const activeMessages =
        msg.userId === action.currentActiveUserId && !state.activeMessages.some((m) => m.id === msg.id)
          ? [...state.activeMessages, msg]
          : state.activeMessages;
      return { ...state, conversations, activeMessages };
    }
    case 'MESSAGE_SENT': {
      const msg = action.message;
      const conversations = state.conversations.map((c) =>
        c.userId === msg.userId
          ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
          : c
      );
      const activeMessages =
        msg.userId === action.currentActiveUserId && !state.activeMessages.some((m) => m.id === msg.id)
          ? [...state.activeMessages, msg]
          : state.activeMessages;
      return { ...state, conversations, activeMessages };
    }
    case 'USER_ONLINE': {
      const { userId, userName, userEmail } = action;
      const idx = state.conversations.findIndex((c) => c.userId === userId);
      if (idx >= 0) {
        const conversations = [...state.conversations];
        conversations[idx] = { ...conversations[idx], isOnline: true };
        return { ...state, conversations };
      }
      const newConvo: ChatConversation = {
        userId,
        userName: userName || userEmail || userId,
        userEmail: userEmail || '',
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
      };
      return { ...state, conversations: [newConvo, ...state.conversations] };
    }
    case 'USER_OFFLINE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.userId === action.userId ? { ...c, isOnline: false } : c
        ),
      };
    case 'MARK_READ':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.userId === action.userId ? { ...c, unreadCount: 0 } : c
        ),
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        activeMessages: state.activeMessages.filter((m) => m.id !== action.messageId),
      };
    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.userId !== action.userId),
        activeUserId: state.activeUserId === action.userId ? null : state.activeUserId,
        activeMessages: state.activeUserId === action.userId ? [] : state.activeMessages,
      };
    default:
      return state;
  }
}

interface UseChatAdminReturn {
  conversations: ChatConversation[];
  activeUserId: string | null;
  activeMessages: ChatMessage[];
  setActiveUserId: (id: string | null) => void;
  sendMessage: (userId: string, content: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteConversation: (userId: string) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
}

function getWsUrl(): string {
  if (typeof window === 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002').replace(/\/api$/, '');
  }

  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3002`;
  }

  const wsProtocol = protocol === 'https:' ? 'https:' : 'http:';

  if (hostname.endsWith('hydracollect.com')) {
    if (hostname.startsWith('qa.')) {
      return `${wsProtocol}//qa-api.hydracollect.com`;
    }
    return `${wsProtocol}//api.hydracollect.com`;
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/api$/, '');
  }

  return window.location.origin;
}

/** Fetch the real JWT from the httpOnly cookie via server-side route */
async function getWsToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/ws-token');
    if (res.ok) {
      const json = await res.json();
      return json.token ?? null;
    }
  } catch {
    // network error
  }
  return null;
}

export function useChatAdmin(): UseChatAdminReturn {
  const socketRef = useRef<Socket | null>(null);
  const [state, dispatch] = useReducer(chatReducer, {
    conversations: [],
    activeUserId: null,
    activeMessages: [],
    isConnected: false,
  });
  const [isPending, startTransition] = useTransition();
  const activeUserRef = useRef<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    activeUserRef.current = state.activeUserId;
  }, [state.activeUserId]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/chat/conversations');
      if (res.ok) {
        const json = await res.json();
        const data: ChatConversation[] = json.data || [];
        // Map current online status if available
        dispatch({
          type: 'SET_CONVERSATIONS',
          conversations: data.map((c) => {
            const existing = state.conversations.find((prev) => prev.userId === c.userId);
            return { ...c, isOnline: existing?.isOnline ?? false };
          }),
        });
      }
    } catch (e) {
      console.error('[AdminChat] fetch convos error', e);
    }
  }, [state.conversations]);

  const fetchHistory = useCallback(
    async (userId: string) => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/proxy/chat/history/user?userId=${userId}&limit=100`);
          if (res.ok) {
            const json = await res.json();
            const messages: Array<{
              id: string;
              user_id: string;
              content: string;
              sender: string;
              created_at: string;
            }> = json.data || [];
            dispatch({
              type: 'SET_ACTIVE_MESSAGES',
              messages: messages.map((m) => ({
                id: m.id,
                userId: m.user_id,
                content: m.content,
                sender: m.sender as 'user' | 'admin',
                createdAt: m.created_at,
              })),
            });
          }
        } catch (e) {
          console.error('[AdminChat] history error', e);
        }
      });
    },
    [startTransition]
  );

  const handleSetActiveUserId = useCallback(
    (id: string | null) => {
      dispatch({ type: 'SET_ACTIVE_USER_ID', userId: id });
      if (id) {
        void fetchHistory(id);
        socketRef.current?.emit('mark_read', { userId: id });
        dispatch({ type: 'MARK_READ', userId: id });
      } else {
        dispatch({ type: 'SET_ACTIVE_MESSAGES', messages: [] });
      }
    },
    [fetchHistory]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    let isEffectActive = true;

    const initSocket = async () => {
      const token = await getWsToken();
      if (!token || !isEffectActive) return;

      const s = io(`${getWsUrl()}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });

      socketRef.current = s;
      setSocket(s);
    };

    initSocket();

    return () => {
      isEffectActive = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => dispatch({ type: 'SET_CONNECTED', isConnected: true });
    const onDisconnect = () => dispatch({ type: 'SET_CONNECTED', isConnected: false });
    const onNewMessage = (msg: ChatMessage) => {
      playNotificationSound();
      if (msg.userId !== activeUserRef.current || document.hidden) {
        toast('Nuevo mensaje recibido', {
          description: msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content,
          duration: 8000,
          icon: '💬',
          action: {
            label: 'Ver',
            onClick: () => {
              window.focus();
              window.location.href = `/dashboard/chat?user=${msg.userId}`;
            },
          },
        });
      }
      dispatch({
        type: 'NEW_USER_MESSAGE',
        message: msg,
        currentActiveUserId: activeUserRef.current,
      });
      if (msg.userId === activeUserRef.current) {
        socket.emit('mark_read', { userId: msg.userId });
      }
    };
    const onMessageSent = (msg: ChatMessage) => {
      dispatch({
        type: 'MESSAGE_SENT',
        message: msg,
        currentActiveUserId: activeUserRef.current,
      });
    };
    const onUserOnline = (data: { userId: string; userName: string; userEmail: string }) => {
      dispatch({ type: 'USER_ONLINE', ...data });
    };
    const onUserOffline = ({ userId }: { userId: string }) => {
      dispatch({ type: 'USER_OFFLINE', userId });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_user_message', onNewMessage);
    socket.on('message_sent', onMessageSent);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_user_message', onNewMessage);
      socket.off('message_sent', onMessageSent);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
      dispatch({ type: 'SET_CONNECTED', isConnected: false });
    };
  }, [socket]);

  const sendMessage = useCallback((userId: string, content: string) => {
    if (!socketRef.current?.connected || !content.trim()) return;
    socketRef.current.emit('admin_reply', { userId, content: content.trim() });
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/proxy/chat/message/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch({ type: 'REMOVE_MESSAGE', messageId });
      }
    } catch (e) {
      console.error('[AdminChat] delete message error', e);
    }
  }, []);

  const deleteConversation = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/proxy/chat/conversation/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch({ type: 'REMOVE_CONVERSATION', userId });
      }
    } catch (e) {
      console.error('[AdminChat] delete conversation error', e);
    }
  }, []);

  return {
    ...state,
    setActiveUserId: handleSetActiveUserId,
    sendMessage,
    deleteMessage,
    deleteConversation,
    isLoading: isPending,
  };
}
