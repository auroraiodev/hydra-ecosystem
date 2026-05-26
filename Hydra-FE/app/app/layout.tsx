import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import Providers from './Providers';
import { ScrollToTop } from '@/features/shared/ui/ScrollToTop';
import { SharedNavbar, SharedFooter } from '@/features/navigation';
import { PageLoadingOverlay } from '@/features/shared/components';
import { getPublicSettings } from '@/lib/api/settings';
import {
  getActiveTCGs,
  getActiveBanners,
  getCategoriesWithProducts,
  type Category,
} from '@/lib/api';
import { baseMetadata, baseViewport, SOCIAL_LINKS } from '@/lib/metadata';
import { RootScripts } from './RootScripts';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = baseMetadata;
export const viewport: Viewport = baseViewport;

import { isMaintenanceModeActive } from '@/lib/api/feature-flags';
import MaintenancePage from './maintenance/page';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check maintenance mode first to avoid unnecessary API calls if down
  const maintenanceActive = await isMaintenanceModeActive();

  if (maintenanceActive) {
    return (
      <html lang="es-MX" suppressHydrationWarning className={inter.variable}>
        <body className="font-display antialiased bg-zinc-950 transition-colors duration-300">
          <MaintenancePage />
        </body>
      </html>
    );
  }

  const [settings, tcgs, globalBanners] = await Promise.all([
    getPublicSettings(),
    getActiveTCGs(),
    getActiveBanners(),
  ]);

  // Pre-fetch categories for all active TCGs to populate the store/cache
  const categoriesMap: Record<string, Category[]> = {};
  if (tcgs.length > 0) {
    const categoriesResults = await Promise.all(
      tcgs.map((tcg) => getCategoriesWithProducts(tcg.id).catch(() => []))
    );
    tcgs.forEach((tcg, index) => {
      categoriesMap[tcg.id] = categoriesResults[index];
    });
  }

  const supportEmail = settings.support_email || 'support@hydracollectables.com';
  const contactPhone = settings.contact_phone || '+520000000000';
  const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hydracollect.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness', 'Store'],
        '@id': `${SITE_URL}/#organization`,
        name: 'Hydra Collectables México',
        alternateName: [
          'Hydra Collectables',
          'MTG México',
          'Magic México',
          'Magic The Gathering México',
          'Hydra MTG',
        ],
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/apple-touch-icon.png`,
          width: 180,
          height: 180,
        },
        image: `${SITE_URL}/opengraph-image`,
        sameAs: SOCIAL_LINKS,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: supportEmail,
            areaServed: 'MX',
            availableLanguage: ['Spanish', 'es'],
          },
        ],
        description:
          'La tienda especializada de Magic: The Gathering en México. Más de 10,000 cartas MTG disponibles con envío a todo el país.',
        slogan: 'La tienda #1 de Magic: The Gathering en México',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'MX',
        },
        telephone: contactPhone,
        priceRange: '$$',
        currenciesAccepted: 'MXN',
        paymentAccepted: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'OXXO'],
        areaServed: { '@type': 'Country', name: 'Mexico' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Hydra Collectables México',
        description:
          'La tienda de cartas Magic en México. Encuentra singles, sellados y accesorios con envíos a todo el país.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/singles/search?query={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'es-MX',
      },
    ],
  };

  return (
    <html lang="es-MX" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://svgs.scryfall.io" />
        <link rel="dns-prefetch" href="https://files.hareruyamtg.com" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
      </head>
      <body className="font-display antialiased bg-vault-bg text-vault-text transition-colors duration-300">
        <RootScripts jsonLd={jsonLd} />
        <Providers
          initialTcgs={tcgs}
          initialCategories={categoriesMap}
          initialBanners={{ global: globalBanners }}
          initialSettings={settings}
        >
          <ScrollToTop />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:p-4 focus:bg-white focus:text-black focus:font-bold focus:shadow-md"
          >
            Saltar al contenido principal
          </a>
          <Suspense fallback={<div className="h-16 w-full bg-vault-bg border-b border-white/5" />}>
            <SharedNavbar />
          </Suspense>
          <PageLoadingOverlay initialSettings={settings} />
          <main id="main-content">{children}</main>
          <SharedFooter />
        </Providers>
      </body>
    </html>
  );
}
