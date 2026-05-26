import { Metadata } from 'next';
import { BannersContent } from '@/app/(dashboard)/dashboard/banners/banners-content';

export const metadata: Metadata = {
  title: 'Banners | Hydra Admin',
  description: 'Manage homepage banners',
};

export default function BannersPage() {
  return <BannersContent />;
}
