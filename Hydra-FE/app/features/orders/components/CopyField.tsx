'use client';

import { Copy } from 'lucide-react';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { cn } from '@/lib/utils';

interface CopyFieldProps {
  value: string;
  label: string;
  mono?: boolean;
  className?: string;
}

export function CopyField({ value, label, mono, className }: CopyFieldProps) {
  const { success } = useToastContext();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      success(`${label} copiado`);
    } catch {
      success(`${label} copiado`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'group relative flex w-full items-center justify-between gap-2 rounded-lg py-2.5 px-3 transition-colors hover:bg-primary/[0.08] active:bg-primary/[0.12] text-left',
        className,
      )}
    >
      <span
        className={cn(
          'font-bold text-text-body text-sm break-all pr-2',
          mono && 'font-mono tracking-wide',
        )}
      >
        {value}
      </span>
      <span className="shrink-0 size-7 rounded-md bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
        <Copy className="size-3.5 text-primary" />
      </span>
    </button>
  );
}
