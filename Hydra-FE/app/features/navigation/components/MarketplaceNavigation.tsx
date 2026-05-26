'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { NAVIGATION_CONSTANTS } from '../constants';

const BottomNavigation = dynamic(
  () => import('./BottomNavigation').then((mod) => mod.BottomNavigation),
  {
    ssr: false,
  }
);

const ChatWidget = dynamic(
  () => import('@/features/chat/components/ChatWidget').then((mod) => mod.ChatWidget),
  {
    ssr: false,
  }
);

export function MarketplaceNavigation() {
  const pathname = usePathname();
  const showBottomNav = !(NAVIGATION_CONSTANTS.HIDE_BOTTOM_NAV as readonly string[]).includes(
    pathname
  );

  return (
    <>
      {showBottomNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNavigation />
        </div>
      )}
      <ChatWidget />
    </>
  );
}
