'use client';

import { useState, useRef, useCallback } from 'react';
import { CardPicker, formatCardToken } from '@/components/chat/CardPicker';
import type { SelectedCard } from '@/components/chat/CardPicker';
import { Button } from '@/components/ui/button';
import { Send24Regular } from '@fluentui/react-icons';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isConnected: boolean;
  activeUserId: string | null;
}

/**
 * Detects an active @"..." query before the cursor.
 * Typing @ auto-inserts "" and places cursor between the quotes.
 */
function getAtQuery(value: string, cursorPos: number): string | null {
  const before = value.slice(0, cursorPos);
  const quotedMatch = before.match(/@"([^"]*)"?$/);
  return quotedMatch ? quotedMatch[1] : null;
}

/** Replaces the @"..." block before the cursor with a card token */
function replaceAtQuery(value: string, cursorPos: number, token: string): string {
  const before = value.slice(0, cursorPos);
  const after = value.slice(cursorPos);
  const replaced = before.replace(/@"[^"]*"?$/, token + ' ');
  if (replaced !== before) {
    const cleanAfter = after.startsWith('"') ? after.slice(1) : after;
    return replaced + cleanAfter;
  }
  return before + after;
}

export function ChatInput({ onSendMessage, isConnected, activeUserId }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [atQuery, setAtQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;

    // Auto-insert "" when @ is typed, place cursor between quotes
    if (val[cursor - 1] === '@') {
      const newVal = val.slice(0, cursor) + '""' + val.slice(cursor);
      setInput(newVal);
      setAtQuery('');
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const scrollHeight = inputRef.current.scrollHeight;
          inputRef.current.style.cssText = `height: ${Math.min(scrollHeight, 120)}px;`;
          inputRef.current.setSelectionRange(cursor + 1, cursor + 1);
        }
      });
      return;
    }

    setInput(val);
    setAtQuery(getAtQuery(val, cursor));
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    const nextHeight = Math.min(target.scrollHeight, 120);
    target.style.height = `${nextHeight}px`;
  };

  const handleCardSelect = useCallback(
    (card: SelectedCard) => {
      const cursor = inputRef.current?.selectionStart ?? input.length;
      const token = formatCardToken(card);
      const newValue = replaceAtQuery(input, cursor, token);
      setInput(newValue);
      setAtQuery(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [input]
  );

  const handleSend = () => {
    if (!input.trim() || !activeUserId) return;
    onSendMessage(input.trim());
    setInput('');
    setAtQuery(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setAtQuery(null);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="p-4 md:px-8 border-t bg-card shrink-0"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex gap-2 items-end relative">
        {atQuery !== null && (
          <CardPicker
            query={atQuery}
            onSelect={handleCardSelect}
            onClose={() => setAtQuery(null)}
          />
        )}
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Responder… escribe @ para buscar cartas"
          className="flex-1 resize-none rounded-2xl pl-4 pr-2 py-2.5 text-sm bg-background border border-muted/80 outline-none focus:border-primary/50 transition-colors [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
          style={{ maxHeight: '120px', lineHeight: '1.5' }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || !isConnected}
          size="icon"
          className="size-10 shrink-0 rounded-2xl shadow-sm cursor-pointer"
        >
          <Send24Regular className="size-4 ml-0.5" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2 hidden md:block">
        Escribe <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">@</kbd> para buscar una
        carta, escribe dentro de las comillas
      </p>
    </div>
  );
}
