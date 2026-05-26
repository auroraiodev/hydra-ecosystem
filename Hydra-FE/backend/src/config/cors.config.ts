import { INestApplication, Logger } from '@nestjs/common';

const logger = new Logger('CorsConfig');

export function setupCors(app: INestApplication): void {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Development: allow all origins so local frontends, Postman, etc. work freely.
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-Request-ID',
      ],
      exposedHeaders: ['X-Request-ID'],
      maxAge: 86400,
      optionsSuccessStatus: 204,
    });

    logger.warn('CORS: development mode — all origins allowed');
    return;
  }

  // Production / QA: strict allowlist from environment variables.
  // FRONTEND_URL, ADMIN_URL, SELLER_URL may each hold a comma-separated list.
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.SELLER_URL,
  ]
    .filter(Boolean)
    .flatMap((v) => v!.split(',').map((u) => u.trim()))
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    logger.error(
      'CORS: no allowed origins configured (FRONTEND_URL / ADMIN_URL / SELLER_URL are unset). All browser requests will be blocked.',
    );
  } else {
    logger.log(`CORS: allowed origins → ${allowedOrigins.join(', ')}`);
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // No Origin header: server-to-server, SSR, mobile, curl — allowed because
      // CORS is a browser-only mechanism and JWT auth still protects every endpoint.
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        new URL(origin); // reject malformed values before the lookup

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`CORS: blocked origin "${origin}"`);
          callback(new Error('Not allowed by CORS'));
        }
      } catch {
        logger.error(`CORS: invalid origin format "${origin}"`);
        callback(new Error('Invalid origin format'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
    optionsSuccessStatus: 204,
  });
}
