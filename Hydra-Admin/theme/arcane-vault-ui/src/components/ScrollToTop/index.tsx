"use client";

import { useEffect } from 'react';

export interface ScrollToTopProps {
  /**
   * Pass the current route pathname so the component scrolls to top
   * whenever it changes.
   *
   * With Next.js:
   *   import { usePathname } from 'next/navigation';
   *   <ScrollToTop pathname={usePathname()} />
   */
  pathname: string;
}

export function ScrollToTop({ pathname }: ScrollToTopProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
