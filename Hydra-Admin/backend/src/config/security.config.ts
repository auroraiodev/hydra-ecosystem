import { INestApplication, Logger } from '@nestjs/common';
import helmet from 'helmet';

const logger = new Logger('SecurityConfig');

export function setupSecurity(app: INestApplication): void {
  const isDev = process.env.NODE_ENV === 'development';
  const appUrl = process.env.FRONTEND_URL || 'https://hydracollect.com';
  const adminUrl = process.env.ADMIN_URL || 'https://admin.hydracollect.com';
  const sellerUrl = process.env.SELLER_URL || 'https://seller.hydracollect.com';
  const apiUrl = process.env.API_URL || 'https://api.hydracollect.com';

  // Content-Security-Policy source lists
  const appOrigins = [appUrl, adminUrl, sellerUrl, apiUrl];

  app.use(
    helmet({
      // ── Content-Security-Policy ──────────────────────────────────────────
      // API server: no pages served, so CSP is minimal.
      // Blocks clickjacking and inline-script injection on any error pages.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          imgSrc: ["'none'"],
          connectSrc: ["'self'", ...appOrigins],
          frameSrc: ["'none'"],
          frameAncestors: ["'none'"], // equivalent to X-Frame-Options: DENY
          formAction: ["'none'"],
          baseUri: ["'none'"],
          objectSrc: ["'none'"],
        },
      },

      // ── HTTP Strict Transport Security ────────────────────────────────────
      // 1 year, include subdomains. Disable in dev (no HTTPS locally).
      strictTransportSecurity: isDev
        ? false
        : {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },

      // ── X-Frame-Options ───────────────────────────────────────────────────
      // Redundant with CSP frame-ancestors but kept for older browser compat.
      frameguard: { action: 'deny' },

      // ── X-Content-Type-Options ────────────────────────────────────────────
      // Prevents MIME-type sniffing.
      noSniff: true,

      // ── X-XSS-Protection ─────────────────────────────────────────────────
      // Legacy header — modern browsers ignore it but no harm keeping it.
      xssFilter: true,

      // ── Referrer-Policy ───────────────────────────────────────────────────
      // Only send origin (no path/query) on cross-origin requests.
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      // ── Permissions-Policy ────────────────────────────────────────────────
      // API server needs none of these browser features.
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },

      // ── X-Powered-By ──────────────────────────────────────────────────────
      // Remove the header — don't advertise the framework.
      hidePoweredBy: true,

      // ── Cross-Origin policies ─────────────────────────────────────────────
      crossOriginEmbedderPolicy: false, // API doesn't serve embedded resources
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow CDN/browser fetches
    }),
  );

  // Permissions-Policy: disable all browser features on API responses
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()',
      ].join(', '),
    );
    next();
  });

  logger.log(`Security headers configured (HSTS ${isDev ? 'disabled' : 'enabled'})`);
}
