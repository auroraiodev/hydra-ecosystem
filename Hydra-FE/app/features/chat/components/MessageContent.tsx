import Image from 'next/image';
import { isSafeImageUrl } from '@/lib/sanitize';
import { parseMessageContent, TextWithLinks } from '../utils/message';
import type { MessageContentProps } from '../types';

export function MessageContent({ content, dark = true }: MessageContentProps) {
  const parts = parseMessageContent(content);
  const mutedColor = dark ? 'text-white/60' : 'text-zinc-500';
  const borderColor = dark ? 'border-white/20' : 'border-zinc-200';

  return (
    <>
      {parts.map((part) =>
        part.type === 'card' ? (
          <span
            key={`${part.type}-${part.name}`}
            className="inline-flex flex-col items-start gap-1 my-1"
          >
            {isSafeImageUrl(part.imageUrl) && (
              <div className="relative w-[110px] aspect-[18/25] flex-shrink-0">
                <Image
                  src={part.imageUrl}
                  alt={part.name}
                  width={110}
                  height={153}
                  className={`rounded-lg border ${borderColor} object-cover shadow-md`}
                />
              </div>
            )}
            <span className={`text-[11px] font-medium ${mutedColor}`}>{part.name}</span>
          </span>
        ) : (
          <span key={part.value} className="whitespace-pre-wrap break-words">
            <TextWithLinks text={part.value} dark={dark} />
          </span>
        )
      )}
    </>
  );
}
