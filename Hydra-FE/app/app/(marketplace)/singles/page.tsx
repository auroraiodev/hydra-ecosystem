import { Metadata } from 'next';
import { SinglesLandingPage } from '@/features/singles-landing';

export const metadata: Metadata = {
  title: 'Singles de Magic: The Gathering en México | Hydra Collectables',
  description:
    'Encuentra singles de Commander, Standard, Modern y más. Compra y vende cartas de Magic con envíos a todo México.',
  keywords: [
    'singles Magic The Gathering México',
    'cartas sueltas MTG',
    'comprar singles MTG',
    'Commander singles México',
    'Modern singles México',
    'cEDH staples México',
    'cartas Magic precio México',
  ],
  alternates: {
    canonical: '/singles',
  },
  openGraph: {
    title: 'Más de 50,000 Singles Disponibles | Hydra Collectables',
    description: 'La mejor selección de singles para tus decks. Envíos seguros y rápidos.',
    images: ['/opengraph-image'],
  },
};

export default async function SinglesPage() {
  return <SinglesLandingPage />;
}
