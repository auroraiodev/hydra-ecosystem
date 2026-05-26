import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta',
  description:
    'Crea tu cuenta en Hydra Collectables y únete a la comunidad más grande de Magic: The Gathering en México.',
  alternates: {
    canonical: '/signup',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
