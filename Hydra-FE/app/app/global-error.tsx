'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { FlowButton } from '@/features/shared/ui/flow-button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <FlowButton
            variant="default"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 h-auto"
            onClick={reset}
          >
            Try again
          </FlowButton>
        </div>
      </body>
    </html>
  );
}
