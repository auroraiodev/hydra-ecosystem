import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Favoritos',
  description:
    'Tu lista de favoritos en Hydra Collectables. Guarda las cartas Magic: The Gathering que más te interesan.',
  alternates: {
    canonical: '/wishlist',
  },
  robots: {
    index: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
