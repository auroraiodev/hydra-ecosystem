import { Metadata } from 'next';
import { HomeView } from '@/features/home';

export const metadata: Metadata = {
  title: 'Hydra Collectables | La Tienda #1 de Magic: The Gathering en México',
  description:
    'La tienda #1 de Magic: The Gathering en México. Más de 10,000 singles disponibles con envío a todo el país. Especialistas en Commander, Modern y sellado.',
  alternates: {
    canonical: '/',
  },
};

// Revalidate every 20 minutes (1200 seconds)
export const revalidate = 0;

export default function Home() {
  return <HomeView />;
}
