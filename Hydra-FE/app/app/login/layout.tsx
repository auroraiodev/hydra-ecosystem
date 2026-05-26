import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description:
    'Inicia sesión en Hydra Collectables para comprar y vender cartas de Magic: The Gathering en México.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
