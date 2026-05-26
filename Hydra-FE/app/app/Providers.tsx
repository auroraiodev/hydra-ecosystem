'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AppProviders } from '@/lib/providers/AppProviders';
import { ToastProvider } from '@/features/shared/components/ToastProvider';
import { SearchLoadingOverlay } from '@/features/shared/components/SearchLoadingOverlay';
import { SearchLoadingProvider } from '@/features/search-filters/contexts/SearchLoadingContext';
import { OAuthHandler } from '@/features/auth/components/OAuthHandler';
import { ReduxHydrator } from '@/lib/store/ReduxHydrator';
import type { Tcg } from '@/lib/types/tcg';
import type { Banner } from '@/lib/api/banners';
import type { Category } from '@/lib/api/categories';
import type { PublicSettings } from '@/lib/api/settings';

const EMPTY_TCGS: Tcg[] = [];
const EMPTY_CATEGORIES: Record<string, Category[]> = {};
const EMPTY_BANNERS: Record<string, Banner[]> = {};

/* Lazy-load heavy/conditional providers to reduce initial JS bundle */
const WelcomeModal = dynamic(
  () =>
    import('@/features/home/components/WelcomeModal').then((m) => ({ default: m.WelcomeModal })),
  { ssr: false }
);

const NotificationsProvider = dynamic(
  () =>
    import('@/features/notifications/contexts/NotificationsContext').then((m) => ({
      default: m.NotificationsProvider,
    })),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
  initialTcgs?: Tcg[];
  initialCategories?: Record<string, Category[]>;
  initialBanners?: Record<string, Banner[]>;
  initialSettings?: PublicSettings;
}

export default function Providers({
  children,
  initialTcgs = EMPTY_TCGS,
  initialCategories = EMPTY_CATEGORIES,
  initialBanners = EMPTY_BANNERS,
  initialSettings,
}: ProvidersProps) {
  const memoizedTcgs = useMemo(() => initialTcgs, [initialTcgs]);
  const memoizedCategories = useMemo(() => initialCategories, [initialCategories]);
  const memoizedBanners = useMemo(() => initialBanners, [initialBanners]);

  return (
    <AppProviders>
      <ReduxHydrator
        tcgs={memoizedTcgs}
        categories={memoizedCategories}
        banners={memoizedBanners}
        settings={initialSettings}
      />
      <ToastProvider>
        <NotificationsProvider>
          <Suspense>
            <OAuthHandler />
            <SearchLoadingProvider>
              <SearchLoadingOverlay />
              {children}
              <WelcomeModal />
            </SearchLoadingProvider>
          </Suspense>
        </NotificationsProvider>
      </ToastProvider>
    </AppProviders>
  );
}
