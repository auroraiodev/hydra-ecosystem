'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface Breadcrumb {
  label: string;
  href: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  disableAutoBreadcrumbs?: boolean;
}

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  wallet: 'Wallet',
  profile: 'Profile',
  settings: 'Settings',
  add: 'New',
  edit: 'Edit',
};

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs: manualBreadcrumbs,
  className = '',
  disableAutoBreadcrumbs = false,
}: PageHeaderProps) {
  const pathname = usePathname();

  const breadcrumbs = React.useMemo(() => {
    if (manualBreadcrumbs) return manualBreadcrumbs;
    if (disableAutoBreadcrumbs) return [];

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href };
    });

    return crumbs;
  }, [pathname, manualBreadcrumbs, disableAutoBreadcrumbs]);

  const hasBreadcrumbs = breadcrumbs.length > 0;
  const hasAction = Boolean(action);

  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      {hasBreadcrumbs && (
        <nav className="flex mb-3 sm:mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-x-1 sm:gap-x-2 flex-wrap">
            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={breadcrumb.href} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-1 sm:mx-1.5 text-muted-foreground/30 text-[10px]">/</span>
                  )}
                  {isLast ? (
                    <span className="text-xs font-bold text-muted-foreground">
                      {breadcrumb.label}
                    </span>
                  ) : (
                    <Link
                      href={breadcrumb.href}
                      className="text-xs font-medium text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                      {breadcrumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground break-words uppercase">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-muted-foreground/80 font-medium max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {hasAction && (
          <div className="flex items-center justify-end sm:justify-start shrink-0 pt-1">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
