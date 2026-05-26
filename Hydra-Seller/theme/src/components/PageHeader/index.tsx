import * as React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderBreadcrumb {
  label: string;
  href: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  className?: string;
  titleClassName?: string;
  /** Inject your router's Link component to enable client-side navigation */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

const DefaultLink = ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
  <a href={href} className={className}>{children}</a>
);

const EMPTY_BREADCRUMBS: PageHeaderBreadcrumb[] = [];

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs = EMPTY_BREADCRUMBS,
  className,
  titleClassName,
  LinkComponent = DefaultLink,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      {breadcrumbs.length > 0 && (
        <nav className="flex mb-3 sm:mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-x-1 sm:gap-x-2">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <span className="mr-1 sm:mr-2 text-text-muted/30 text-[10px]">/</span>
                  )}
                  {isLast ? (
                    <span className="text-xs font-bold text-text-muted">{crumb.label}</span>
                  ) : (
                    <LinkComponent
                      href={crumb.href}
                      className="text-xs font-medium text-text-muted/60 hover:text-primary transition-colors"
                    >
                      {crumb.label}
                    </LinkComponent>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className={cn('text-2xl sm:text-3xl font-semibold text-text-body tracking-tight', titleClassName)}>
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-text-muted font-medium max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center justify-end sm:justify-start shrink-0 pt-1">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
