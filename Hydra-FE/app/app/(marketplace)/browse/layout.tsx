import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explorar Cartas de Magic: The Gathering | Hydra Collectables',
  description:
    'Explora el catálogo completo de cartas de Magic: The Gathering en México. Filtra por set, formato, color y más.',
  keywords: [
    'explorar cartas Magic México',
    'catálogo MTG México',
    'sets Magic The Gathering',
    'filtrar cartas MTG',
    'cartas por expansión México',
    'browse MTG singles',
  ],
  alternates: {
    canonical: '/browse',
  },
  openGraph: {
    title: 'Explorar Cartas de Magic: The Gathering | Hydra Collectables',
    description:
      'Explora el catálogo completo de cartas de Magic: The Gathering en México. Filtra por set, formato, color y más.',
    images: ['/opengraph-image'],
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
