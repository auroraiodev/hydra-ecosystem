import * as React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = ({ className, ref, ...props }: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-lg border border-border-subtle bg-surface px-3 py-2',
      'text-sm text-text-body placeholder:text-text-muted resize-y',
      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export { Textarea };
