import * as React from 'react';
import { cn } from '../../utils/cn';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

/**
 * Single metric display card — label, large value, optional icon and trend.
 */
export function StatCard({ label, value, description, icon, trend, className, ...props }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-border-subtle p-5 flex flex-col gap-3',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</p>
        {icon && (
          <span className="shrink-0 text-text-muted opacity-60">{icon}</span>
        )}
      </div>

      <p className="text-3xl font-black text-text-body tracking-tight">{value}</p>

      {(description || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded-md',
                trend.positive
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {description && (
            <p className="text-xs text-text-muted">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
