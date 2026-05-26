import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description:
    'Completa tu compra de cartas Magic: The Gathering en Hydra Collectables. Envíos seguros a todo México.',
  alternates: {
    canonical: '/checkout',
  },
  robots: {
    index: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
