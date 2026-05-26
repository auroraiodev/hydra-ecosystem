declare module '@sentry/nextjs' {
  export function captureException(exception: unknown): string;
  export function captureRouterTransitionStart(): void;
  export function captureRequestError(error: unknown): void;
  export function init(options: { dsn?: string; debug?: boolean; integrations?: unknown[] }): void;
  export function withSentryConfig<T>(config: T, options?: Record<string, unknown>): T;
}
