'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('./Footer').then((mod) => mod.Footer), {
  ssr: true,
});

export function SharedFooter() {
  const pathname = usePathname();

  // Don't show footer on login and signup pages
  // Also hidden on admin dashboard if that route follows a specific pattern (optional)
  const hideFooter = pathname === '/login' || pathname === '/signup';

  if (hideFooter) {
    return null;
  }

  // Footer is visible on both mobile and desktop (unlike the desktop-only navbar)
  // We wrap it to match the structure if needed, or simply render it
  return <Footer />;
}
