import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vender Cartas MTG | Hydra Collectables México',
  description:
    'Vende tus cartas de Magic: The Gathering en consignación en Hydra Collectables. Sin riesgo, 12% de comisión solo cuando se vende. La tienda más confiable de México.',
  keywords: [
    'vender cartas Magic México',
    'consignación MTG México',
    'vender singles Magic The Gathering',
    'Hydra Collectables consignación',
    'vender cartas MTG',
    'tienda cartas Magic México',
  ],
  openGraph: {
    title: 'Vende tus Cartas MTG en Consignación | Hydra Collectables',
    description:
      'Sin riesgo, 12% de comisión solo cuando se vende. La plataforma más confiable para vender cartas de Magic en México.',
    images: ['/opengraph-image'],
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
