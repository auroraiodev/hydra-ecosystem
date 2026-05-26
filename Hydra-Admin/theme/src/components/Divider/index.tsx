import { cn } from '../../utils/cn';

export interface DividerProps {
  className?: string;
  vertical?: boolean;
  text?: string;
}

export function Divider({ className = '', vertical = false, text }: DividerProps) {
  if (text) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="h-[1px] flex-1 bg-white/[0.06]" />
        <span className="text-xs text-zinc-500">{text}</span>
        <div className="h-[1px] flex-1 bg-white/[0.06]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white/[0.06]',
        vertical ? 'w-[1px] h-full' : 'h-[1px] w-full',
        className
      )}
    />
  );
}
