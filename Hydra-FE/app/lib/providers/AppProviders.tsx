'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store, initializeAuth } from '../store';
import { LazyMotion, MotionConfig } from 'framer-motion';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Create a client for each request to avoid data sharing between users
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors except 408, 429
          const status = (error as { status?: number })?.status;
          if (status !== undefined && status >= 400 && status < 500) {
            return status === 408 || status === 429;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // Disable for better UX
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Use useMemo to avoid recreating the client on every render
  const [queryClient] = React.useState(() => createQueryClient());

  React.useEffect(() => {
    // Initial token restore on mount
    store.dispatch(initializeAuth());

    // Re-validate session whenever the user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        store.dispatch(initializeAuth());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <LazyMotion features={async () => (await import('framer-motion')).domAnimation}>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </LazyMotion>
      </Provider>
    </QueryClientProvider>
  );
};
