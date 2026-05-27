/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,

  experimental: {
    optimizeCss: false,
    optimizePackageImports: [
      '@fluentui/react-icons',
      'react-icons',
      'recharts',
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
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: '*.scryfall.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: '*.media-amazon.com', pathname: '/**' },
    ],
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // Strict CSP for admin dashboard — no external scripts, no inline eval
    const csp = [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob: http://localhost:3002 http://127.0.0.1:3002 https://api.hydracollect.com https://*.hydracollect.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.supabase.co https://*.scryfall.com https://*.scryfall.io https://*.media-amazon.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.scryfall.com https://api.hydracollect.com wss://api.hydracollect.com https://*.hydracollect.com wss://*.hydracollect.com ${isDev ? 'http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*' : ''}`,
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
