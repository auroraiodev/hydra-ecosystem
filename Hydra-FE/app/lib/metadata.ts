import type { Metadata, Viewport } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hydracollect.com';

export const SOCIAL_LINKS = [
  'https://www.facebook.com/hydracollectables',
  'https://www.instagram.com/hydracollectables',
  'https://x.com/hydracollect',
];

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Hydra Collectables | La Tienda #1 de Magic: The Gathering en México',
    template: '%s | Hydra Collectables - México',
  },
  description:
    'La tienda #1 de Magic: The Gathering en México. Compra cartas MTG con envío a toda la República. Singles, Commander, Modern y sellado. +10,000 cartas en stock.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hydra Collectables',
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    'magic mexico',
    'mtg mexico',
    'cartas magic mexico',
    'tienda mtg mexico',
    'comprar magic mexico',
    'singles mtg',
    'commander mexico',
    'hydra collectables',
    'magic the gathering mexico',
  ],
  authors: [{ name: 'Hydra Collectables Team' }],
  publisher: 'Hydra Collectables',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/cat.png', type: 'image/png' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
    ],
    shortcut: '/cat.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: SITE_URL,
    siteName: 'Hydra Collectables México',
    title: 'Hydra Collectables | Tienda #1 de Magic: The Gathering en México',
    description:
      'La tienda especializada en Magic: The Gathering en México. Más de 10,000 singles, sellado y accesorios con envío a todo el país. Precios en pesos.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Hydra Collectables - La Tienda #1 de MTG en México',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hydracollect',
    creator: '@hydracollect',
    title: 'Hydra Collectables | Tienda #1 de MTG en México',
    description:
      'La tienda #1 de Magic The Gathering en México. +10,000 cartas disponibles con envío expedito.',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'nQkvdRCyQ7-lunFNscOQ0NyuVqw5FMyNfaSFlcIKjmM',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'es-MX': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  other: {
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#148a81',
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'Content-Security-Policy': 'upgrade-insecure-requests',
  },
};

export const baseViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#148a81',
  interactiveWidget: 'resizes-content',
};
