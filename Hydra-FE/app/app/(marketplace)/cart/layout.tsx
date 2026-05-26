import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carrito de Compras',
  description:
    'Tu carrito de compras en Hydra Collectables. Revisa y completa tu pedido de cartas Magic: The Gathering.',
  alternates: {
    canonical: '/cart',
  },
  robots: {
    index: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
