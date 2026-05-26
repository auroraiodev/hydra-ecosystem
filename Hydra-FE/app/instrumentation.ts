import * as Sentry from '@sentry/nextjs';

export const onRequestError = Sentry.captureRequestError;

export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({ dsn, debug: false });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({ dsn, debug: false });
  }
}
