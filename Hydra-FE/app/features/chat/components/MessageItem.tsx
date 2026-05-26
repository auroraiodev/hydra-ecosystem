import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import type { MessageItemProps } from '../types';

export function MessageItem({ sender, content, createdAt }: MessageItemProps) {
  const isUser = sender === 'user';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="size-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white mt-0.5 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.3)] bg-teal">
          H
        </div>
      )}
      <div
        className={cn(
          'relative flex flex-col rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[78%] shadow-lg min-w-[90px]',
          isUser
            ? 'rounded-tr-sm bg-teal/20 backdrop-blur-md border border-teal/20 text-white shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.1)]'
            : 'rounded-tl-sm vault-glass-card border-white/5'
        )}
      >
        <div
          className={cn(
            'text-[13px] sm:text-sm leading-relaxed',
            isUser ? 'text-white' : 'text-white/90'
          )}
        >
          <MessageContent content={content} dark={isUser} />
        </div>
        <p
          className={cn(
            'text-[9px] sm:text-[10px] mt-1 text-right',
            isUser ? 'text-white/70' : 'text-white/30'
          )}
        >
          {formatTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
