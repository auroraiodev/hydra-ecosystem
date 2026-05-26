export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  sender: 'user' | 'admin' | 'support' | 'system';
  createdAt: string;
}

export interface ScryfallCard {
  id: string;
  name: string;
  image_uris?: { small: string };
  card_faces?: Array<{ image_uris?: { small: string } }>;
}

export interface SelectedCard {
  name: string;
  imageUrl: string;
}

export interface UseChatSocketReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  unreadCount: number;
  clearUnread: () => void;
}

export interface ChatHeaderProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  pushSupported: boolean;
  pushSubscribed: boolean;
  pushLoading: boolean;
  onPushToggle: () => void;
  onClose: () => void;
}

export interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  atQuery: string | null;
  setAtQuery: (val: string | null) => void;
  isConnected: boolean;
  onSendMessage: (content: string) => void;
}

export interface CardPickerProps {
  query: string;
  onSelect: (card: SelectedCard) => void;
  onClose: () => void;
  dark?: boolean;
}

export interface UseCardSearchReturn {
  cards: ScryfallCard[];
  loading: boolean;
}

export interface MessageContentProps {
  content: string;
  dark?: boolean;
}

export interface MessageItemProps {
  id: string;
  sender: ChatMessage['sender'];
  content: string;
  createdAt: string;
  userName?: string;
}
