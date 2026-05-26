"use client";

import React, { useCallback, useRef } from 'react';

export interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchOnHover?: boolean;
  tabIndex?: number;
  'aria-label'?: string;
  /**
   * Callback that triggers prefetching when the user hovers.
   * With Next.js App Router:
   *   const router = useRouter();
   *   <PrefetchLink onPrefetch={(href) => router.prefetch(href)} href={...}>
   */
  onPrefetch?: (href: string) => void;
  /**
   * Override the underlying element. Pass Next.js `Link` for client-side
   * navigation while still getting the hover-prefetch behaviour:
   *   <PrefetchLink LinkComponent={NextLink} href={...} onPrefetch={...}>
   */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    tabIndex?: number;
    'aria-label'?: string;
    children?: React.ReactNode;
  }>;
}

export function PrefetchLink({
  children,
  prefetchOnHover = true,
  onPrefetch,
  href,
  LinkComponent,
  ...props
}: PrefetchLinkProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!prefetchOnHover || !onPrefetch) return;
    timerRef.current = setTimeout(() => onPrefetch(href), 50);
  }, [prefetchOnHover, onPrefetch, href]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const Comp = (LinkComponent ?? 'a') as React.ElementType;

  return (
    <Comp
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Comp>
  );
}
