import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['arcane-vault-ui'],
  poweredByHeader: false,
  compress: true,

  // Standalone build — tracing root is the app directory
  outputFileTracingRoot: join(__dirname, '.'),

  experimental: {
    optimizeCss: false,
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    // Disable optimization in dev to avoid remotePatterns issues with proxy URLs
    unoptimized: process.env.NODE_ENV === 'development',
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: '**.sslip.io', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3002', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3002', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'web-uwf962mnz48agqf78kdk1mpq.87.99.141.73.sslip.io',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 'api.hydracollect.com', pathname: '/**' },
      { protocol: 'https', hostname: 'qa-api.hydracollect.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.hydracollect.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.importationmtg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'importationmtg.com', pathname: '/**' },
    ],
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // Derive the API origin from the env var so the CSP works across all
    // environments (local, QA, prod) without manual updates.
    // NEXT_PUBLIC_AUTH_SERVICE_URL is the clean origin (no /api suffix).
    const apiOrigin =
      (process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://api.hydracollect.com')
        .replace(/\/$/, '');
    const apiWssOrigin = apiOrigin.replace(/^https?:\/\//, 'wss://');

    // Strict CSP for admin dashboard — no external scripts, no inline eval
    const csp = [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob: http://localhost:3002 http://127.0.0.1:3002 https://api.hydracollect.com https://*.hydracollect.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.supabase.co https://*.scryfall.com https://*.scryfall.io https://*.media-amazon.com https://*.importationmtg.com https://importationmtg.com https://*.sslip.io",
      // Allow connections to the backend API (env-derived so QA/prod/dev all work)
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.scryfall.com https://*.hydracollect.com wss://*.hydracollect.com ${apiOrigin} ${apiWssOrigin} ${isDev ? 'http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*' : ''}`.trim(),
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;
