'use client';

import Image from 'next/image';
import { parseMessageContent } from '@/components/chat/CardPicker';
import { isSafeImageUrl } from '@/lib/sanitize';

export function MessageContent({ content }: { content: string }) {
  const parts = parseMessageContent(content);
  return (
    <>
      {parts.map((part, i) => {
        const key = `part-${part.type}-${i}`;
        return part.type === 'card' ? (
          <span key={key} className="inline-flex flex-col items-start gap-1 my-1">
            {isSafeImageUrl(part.imageUrl) && (
              <Image
                src={part.imageUrl}
                alt={part.name}
                width={120}
                height={160}
                className="rounded-lg border border-border/60 max-w-[120px] shadow-sm object-contain"
                unoptimized
              />
            )}
            <span className="text-xs opacity-70 font-medium">{part.name}</span>
          </span>
        ) : (
          <span key={key} className="whitespace-pre-wrap break-words">
            {part.value}
          </span>
        );
      })}
    </>
  );
}
