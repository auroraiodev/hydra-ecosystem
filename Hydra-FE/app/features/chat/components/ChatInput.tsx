import React, { useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { CardPicker } from './CardPicker';
import { getAtQuery, formatCardToken, replaceAtQuery } from '../utils/message';
import type { SelectedCard, ChatInputProps } from '../types';

export function ChatInput({
  input,
  setInput,
  atQuery,
  setAtQuery,
  isConnected,
  onSendMessage,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resizeInput = useCallback((cursor?: number) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    el.style.height = 'auto';
    const newHeight = `${Math.min(el.scrollHeight, 120)}px`;
    el.style.height = newHeight;
    if (cursor !== undefined) {
      el.setSelectionRange(cursor, cursor);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;

    // Auto-insert "" when @ is typed, place cursor between quotes
    if (val[cursor - 1] === '@') {
      const newVal = val.slice(0, cursor) + '""' + val.slice(cursor);
      setInput(newVal);
      setAtQuery('');
      requestAnimationFrame(() => resizeInput(cursor + 1));
      return;
    }

    setInput(val);
    setAtQuery(getAtQuery(val, cursor));
    requestAnimationFrame(() => resizeInput());
  }, [setInput, setAtQuery, resizeInput]);

  const handleCardSelect = useCallback((card: SelectedCard) => {
    const cursor = inputRef.current?.selectionStart ?? input.length;
    const token = formatCardToken(card.name, card.imageUrl);
    const newValue = replaceAtQuery(input, cursor, token);
    setInput(newValue);
    setAtQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, setInput, setAtQuery]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setAtQuery(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }, [input, onSendMessage, setInput, setAtQuery]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setAtQuery(null);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [setAtQuery, handleSend]);

  const handleCloseCardPicker = useCallback(() => {
    setAtQuery(null);
  }, [setAtQuery]);

  return (
    <div className="flex-shrink-0 p-4 relative bg-white/5 backdrop-blur-md border-t border-white/10">
      {atQuery !== null && (
        <CardPicker
          query={atQuery}
          onSelect={handleCardSelect}
          onClose={handleCloseCardPicker}
          dark
        />
      )}
      <div className="flex items-end gap-3">
        <textarea
          ref={inputRef}
          id="chat-widget-input"
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje..."
          className="flex-1 resize-none rounded-xl pl-4 pr-3 py-3 text-[13px] text-vault-text placeholder-vault-text-muted/40 outline-none transition-all bg-white/5 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal/20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
          style={{
            maxHeight: '120px',
            lineHeight: '1.5',
          }}
        />
        <button
          id="chat-widget-send"
          onClick={handleSend}
          disabled={!input.trim() || !isConnected}
          className="size-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-90 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.2)] bg-teal hover:shadow-[0_0_30px_rgba(var(--glow-teal-rgb)/0.3)]"
          aria-label="Enviar mensaje"
        >
          <Send className="size-4.5 text-white ml-0.5" />
        </button>
      </div>
      {/* Safe area padding for iOS home indicator */}
      <div
        className="h-safe-area-inset-bottom sm:hidden"
        style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
      />
    </div>
  );
}

