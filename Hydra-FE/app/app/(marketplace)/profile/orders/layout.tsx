import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Pedidos',
  description:
    'Historial de pedidos en Hydra Collectables. Revisa el estado de tus compras de cartas Magic: The Gathering.',
  alternates: {
    canonical: '/profile/orders',
  },
  robots: {
    index: false,
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
