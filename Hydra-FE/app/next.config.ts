import path from 'path';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
// @ts-expect-error - next-pwa lacks built-in types
import withPWAInit from 'next-pwa';
import withBundleAnalyzerInit from '@next/bundle-analyzer';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/(?:v0|v1|cdn)\.scryfall\.io\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'scryfall-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
});

// ---------------------------------------------------------------------------
// Content-Security-Policy
// ---------------------------------------------------------------------------
// CSP is now handled dynamically in proxy.ts middleware.

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  // Ensure no sources are leaked in standard build output
  generateBuildId: async () => 'production',

  // Required for pnpm monorepo standalone builds
  outputFileTracingRoot: path.join(__dirname, '../../'),

  transpilePackages: ['arcane-vault-ui'],

  experimental: {
    // FIXME: optimizeCss is currently disabled due to build-time stability issues in Next.js 16/Turbopack
    optimizeCss: false,
    optimizePackageImports: [
      'arcane-vault-ui',
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-slot',
      'date-fns',
      '@tanstack/react-query',
      // 'axios', // removed - dead dependency, using native fetch
      'clsx',
      'tailwind-merge',
      'embla-carousel-react',
      'lucide-react/dist/esm/icons/chevron-left',
      'lucide-react/dist/esm/icons/chevron-right',
      'lucide-react/dist/esm/icons/shopping-cart',
      'lucide-react/dist/esm/icons/heart',
      'lucide-react/dist/esm/icons/menu',
      'lucide-react/dist/esm/icons/x',
      'lucide-react/dist/esm/icons/layout-grid',
      'lucide-react/dist/esm/icons/search',
      'lucide-react/dist/esm/icons/user',
      'lucide-react/dist/esm/icons/bell',
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  serverExternalPackages: ['sharp'],
  reactStrictMode: true,

  webpack(config) {
    config.infrastructureLogging = { level: 'error' };

    // Explicitly disable source maps in production to eliminate 'Map has no mappings' errors
    if (process.env.NODE_ENV === 'production') {
      config.devtool = false;
    }

    return config;
  },

  images: {
    // sharp is installed — full Next.js image optimization enabled
    // Disable optimization in dev to avoid remotePatterns issues with proxy URLs
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 80],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 224, 256, 288, 320, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'html.tailus.io', pathname: '/**' },
      { protocol: 'https', hostname: 'svgs.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: 'img.global.userapi.com', pathname: '/**' },
      { protocol: 'https', hostname: 'm.media-amazon.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.sslip.io', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'web-uwf962mnz48agqf78kdk1mpq.87.99.141.73.sslip.io',
        pathname: '/**',
      },
      { protocol: 'http', hostname: 'localhost', port: '3002', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3002', pathname: '/**' },
      { protocol: 'https', hostname: 'api.hydracollect.com', pathname: '/**' },
      { protocol: 'https', hostname: 'qa-api.hydracollect.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.hydracollect.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.vtexassets.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.importationmtg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'importationmtg.com', pathname: '/**' },
    ],
  },

  poweredByHeader: false,
  compress: true,
  trailingSlash: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.hydracollect.com' }],
        destination: 'https://hydracollect.com/:path*',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    // BACKEND_API_URL must be set at runtime (Coolify env config).
    // Defaults to the local NestJS backend on port 3002.
    const backendBase = (
      process.env.BACKEND_API_URL || 'http://127.0.0.1:3002'
    ).replace(/\/$/, '');

    return {
      // beforeFiles: run before Next.js checks its own pages/API routes
      beforeFiles: [],

      // afterFiles: run only when no Next.js page or API route matched.
      // This lets /api/auth/session, /api/auth/oauth/callback, etc. continue
      // to be served by Next.js while all other /api/* calls are proxied to
      // the backend at /api/v1/*.
      afterFiles: [
        // Static-asset proxies (no Next.js route for these)
        {
          source: '/uploads/:path*',
          destination: `${backendBase}/uploads/:path*`,
        },
        // General API catch-all: /api/<anything> → backend /api/v1/<anything>
        {
          source: '/api/:path*',
          destination: `${backendBase}/api/v1/:path*`,
        },
      ],

      // fallback: internal page alias rewrites
      fallback: [
        {
          source: '/bundles/search',
          destination: '/singles/search?category=Bundle&local=true&pagination=true',
        },
        {
          source: '/micas/search',
          destination: '/singles/search?category=MICAS&local=true&pagination=true',
        },
        {
          source: '/decks/search',
          destination: '/singles/search?category=PRECON_DECK&local=true&pagination=true',
        },
      ],
    };
  },
};

const finalConfig = withBundleAnalyzer(withPWA(nextConfig));

export default withSentryConfig(finalConfig, {
  silent: true,
  org: 'hydra-collectables',
  project: 'javascript-nextjs',
});
