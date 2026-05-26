import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Centro de Ayuda | Hydra Collectables',
  description:
    'Resuelve tus dudas sobre compras, envíos, pagos y devoluciones en Hydra Collectables. Respuestas rápidas a las preguntas más frecuentes.',
  keywords: [
    'ayuda Hydra Collectables',
    'soporte MTG México',
    'preguntas frecuentes Magic',
    'envíos cartas México',
    'pagos Magic The Gathering',
    'devoluciones MTG',
  ],
  openGraph: {
    title: 'Centro de Ayuda | Hydra Collectables',
    description: 'Resuelve tus dudas sobre compras, envíos, pagos y devoluciones.',
    images: ['/opengraph-image'],
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
