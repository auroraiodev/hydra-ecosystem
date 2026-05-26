'use client';

import { usePathname } from 'next/navigation';
import { ScrollToTop as DSScrollToTop } from 'arcane-vault-ui';

export function ScrollToTop() {
  const pathname = usePathname();
  return <DSScrollToTop pathname={pathname} />;
}
