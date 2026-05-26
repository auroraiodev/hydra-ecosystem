'use client';
import * as React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PageHeader as DSPageHeader,
  type PageHeaderProps,
  type PageHeaderBreadcrumb,
} from 'arcane-vault-ui';

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  chat: 'Chat',
  products: 'Products',
  categories: 'Categories',
  tcgs: 'TCGs',
  tags: 'Tags',
  orders: 'Orders',
  imports: 'Imports',
  inventario: 'Inventory',
  historial: 'History',
  analytics: 'Analytics',
  wallet: 'Wallet',
  carts: 'Carts',
  'feature-flags': 'Feature Flags',
  profile: 'Profile',
  settings: 'Settings',
  banners: 'Banners',
  sales: 'Sales',
  listings: 'Listings',
  add: 'New',
  edit: 'Edit',
};

type AdminPageHeaderProps = Omit<PageHeaderProps, 'LinkComponent' | 'breadcrumbs'> & {
  breadcrumbs?: PageHeaderBreadcrumb[];
  disableAutoBreadcrumbs?: boolean;
};

export function PageHeader({
  breadcrumbs,
  disableAutoBreadcrumbs,
  ...props
}: AdminPageHeaderProps) {
  const pathname = usePathname();

  const crumbs = React.useMemo<PageHeaderBreadcrumb[]>(() => {
    if (breadcrumbs) return breadcrumbs;
    if (disableAutoBreadcrumbs) return [];
    return pathname.split('/').reduce<PageHeaderBreadcrumb[]>((acc, seg, i, arr) => {
      if (!seg) return acc;
      acc.push({
        href: '/' + arr.slice(0, i + 1).join('/'),
        label: routeMap[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      });
      return acc;
    }, []);
  }, [pathname, breadcrumbs, disableAutoBreadcrumbs]);

  return (
    <DSPageHeader
      {...props}
      breadcrumbs={crumbs}
      LinkComponent={NextLink as PageHeaderProps['LinkComponent']}
    />
  );
}

export type { PageHeaderProps as AdminPageHeaderProps };
