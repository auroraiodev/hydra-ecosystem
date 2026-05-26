import * as React from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Empty content state — shown when a list, table, or section has no data.
 */
export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex items-center justify-center size-14 rounded-2xl bg-surface-low text-text-muted">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-text-body">{title}</p>
        {description && (
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
