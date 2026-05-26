import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hydracollect.com';

  const privateRoutes = [
    '/profile',
    '/checkout',
    '/admin',
    '/profile/orders',
    '/wishlist',
    '/cart',
    '/api/',
    '/*?*debug=',
    '/*?*preview=',
  ];

  // Paginated / filtered pages — avoid duplicate content indexing.
  // Disallow ?pagination=N (page 2+), ?pagination=true (UI flag), and ?page= variants.
  const paginationRoutes = [
    '/*?*page=',
    '/*?*pagination=true',
    '/*?*pagination=false',
    ...Array.from({ length: 49 }, (_, i) => `/*?*pagination=${i + 2}`),
  ];

  return {
    rules: [
      // Standard search crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [...privateRoutes, ...paginationRoutes],
      },

      // AI crawlers — allowed on the full public catalog for GEO visibility
      // (ChatGPT, Perplexity, Gemini, Claude cite pages they can read)
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Google-Extended',
          'ClaudeBot',
          'anthropic-ai',
        ],
        allow: '/',
        disallow: privateRoutes,
      },

      // Low-value scrapers — no SEO or GEO benefit, block entirely
      {
        userAgent: ['Bytespider', 'CCBot', 'FacebookBot', 'Amazonbot', 'Applebot-Extended'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
