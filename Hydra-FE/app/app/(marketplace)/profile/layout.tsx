import { Metadata } from 'next';
import { AuthGuard } from '@/features/shared/components';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description: 'Tu perfil en Hydra Collectables. Administra tu cuenta, direcciones y preferencias.',
  alternates: {
    canonical: '/profile',
  },
  robots: {
    index: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
