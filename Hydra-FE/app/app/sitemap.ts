import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/constants/api';
import { generateSlug } from '@/lib/utils/slug';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hydracollect.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { route: '', priority: 1, changeFrequency: 'daily' as const },
    { route: '/singles', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/browse', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/help', priority: 0.4, changeFrequency: 'monthly' as const },
    { route: '/authenticity', priority: 0.4, changeFrequency: 'monthly' as const },
    { route: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
    { route: '/returns', priority: 0.4, changeFrequency: 'monthly' as const },
    { route: '/sell', priority: 0.8, changeFrequency: 'weekly' as const },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const categoryRoutes = ['SINGLES', 'PRECON_DECK', 'BUNDLE', 'MICAS', 'ACCESSORIES'].map(
    (cat) => ({
      url: `${baseUrl}/singles/search?category=${cat}`.replace(/&/g, '&amp;'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })
  );

  // High-priority SEO keyword routes for "magic mexico", "mtg mexico", etc.
  const seoRoutes = [
    // Primary target keywords
    { q: 'magic mexico', priority: 1.0 },
    { q: 'mtg mexico', priority: 1.0 },
    { q: 'magic the gathering mexico', priority: 1.0 },
    // Secondary keywords
    { q: 'cartas magic mexico', priority: 0.9 },
    { q: 'tienda mtg mexico', priority: 0.9 },
    { q: 'comprar magic mexico', priority: 0.9 },
    { q: 'singles mtg', priority: 0.9 },
    // Format keywords
    { q: 'commander', priority: 0.9 },
    { q: 'modern', priority: 0.8 },
    { q: 'standard', priority: 0.8 },
    { q: 'pioneer', priority: 0.8 },
    { q: 'legacy', priority: 0.8 },
    { q: 'pauper', priority: 0.7 },
    // Product keywords
    { q: 'cartas sueltas mtg', priority: 0.8 },
    { q: 'sobres magic', priority: 0.8 },
    { q: 'cajas magic', priority: 0.8 },
    { q: 'precon commander', priority: 0.8 },
    // City-specific (local SEO)
    { q: 'mtg cdmx', priority: 0.7 },
    { q: 'mtg monterrey', priority: 0.7 },
    { q: 'mtg guadalajara', priority: 0.7 },
  ].map(({ q, priority }) => ({
    url: `${baseUrl}/singles/search?q=${encodeURIComponent(q)}`.replace(/&/g, '&amp;'),
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority,
  }));

  // Parallelize fetches to eliminate waterfalls (Antigravity Kit Optimization)
  // Wrap in try-catch: fetch() itself throws ECONNREFUSED at build time when
  // the backend is not reachable, which would crash the entire build.
  let expansionRes: Response | null = null;
  let productRes: Response | null = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    [expansionRes, productRes] = await Promise.all([
      fetch(`${API_URL}/singles/expansions`, {
        cache: 'no-store',
        signal: controller.signal,
      }),
      fetch(`${API_URL}/singles?limit=5000&fields=id,cardName,updatedAt`, {
        cache: 'no-store',
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeoutId);
  } catch (error) {
    console.error('Sitemap: backend unreachable at build time, skipping dynamic routes:', error);
  }

  let expansionRoutes: MetadataRoute.Sitemap = [];
  try {
    if (expansionRes?.ok) {
      const data = await expansionRes.json();
      const expansions: string[] = Array.isArray(data) ? data : data.data || [];
      expansionRoutes = expansions.map((exp) => ({
        url: `${baseUrl}/singles/set/${encodeURIComponent(exp)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error parsing expansions for sitemap:', error);
  }

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    if (productRes?.ok) {
      const json = await productRes.json();
      const products = json.data?.data || json.data || [];
      productRoutes = (
        products as Array<{ id?: string; cardName?: string; updatedAt?: string }>
      ).reduce<MetadataRoute.Sitemap>((acc, product) => {
        if (!product.id) return acc;
        const name = product.cardName || '';
        const slug = generateSlug(name);
        const productUrl = `${baseUrl}/singles/${product.id}${slug ? `-${slug}` : ''}`;

        acc.push({
          url: productUrl,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
        return acc;
      }, []);
    }
  } catch (error) {
    console.error('Error parsing products for sitemap:', error);
  }

  return [...staticRoutes, ...categoryRoutes, ...seoRoutes, ...expansionRoutes, ...productRoutes];
}
