import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (typeof window !== 'undefined' && dsn) {
  const initSentry = () => {
    Sentry.init({
      dsn,
      debug: false,
      // Session Replay removed to reduce bundle size and main-thread work
      integrations: [],
    });
  };

  if (document.readyState === 'complete') {
    initSentry();
  } else {
    window.addEventListener('load', initSentry, { once: true });
  }
}
