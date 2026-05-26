import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Base bordered panel/box container — the repeating
 * `bg-surface rounded-2xl border border-border-subtle` pattern.
 */
export const Section = ({ className, children, ref, ...props }: SectionProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    className={cn(
      'bg-surface rounded-2xl border border-border-subtle overflow-hidden',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ── SectionHeader ──────────────────────────────────────────────────────────

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, icon, action, className, ...props }: SectionHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 p-5 border-b border-border-subtle', className)}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="shrink-0 text-text-muted">{icon}</span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-body truncate">{title}</h3>
          {description && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── SectionBody ────────────────────────────────────────────────────────────

export interface SectionBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SectionBody = ({ className, children, ref, ...props }: SectionBodyProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn('p-5', className)} {...props}>
    {children}
  </div>
);
