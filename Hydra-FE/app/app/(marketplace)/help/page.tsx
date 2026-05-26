import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'Centro de Ayuda | Magic Mexico - Hydra Collectables',
  description:
    'Encuentra respuestas a tus preguntas sobre pedidos, envios, devoluciones y autenticidad de cartas Magic The Gathering. Soporte en menos de 24 horas.',
  keywords: [
    'ayuda magic mexico',
    'soporte hydra collectables',
    'preguntas frecuentes mtg',
    'envios magic mexico',
    'devoluciones cartas mtg',
    'contacto hydra',
  ],
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Centro de Ayuda | Hydra Collectables',
    description: 'Soporte rapido y eficiente para todas tus compras de Magic The Gathering.',
  },
};

export default function HelpPage() {
  const faqs = [
    {
      question: '¿Cómo compro cartas en Hydra Collectables?',
      answer:
        'Busca la carta que deseas, agrégala al carrito y procede al checkout. Aceptamos múltiples métodos de pago, incluyendo tarjetas bancarias, transferencia y Google Pay.',
    },
    {
      question: '¿Cuánto tarda el envío?',
      answer:
        'Los envíos dentro de México tardan entre 3 a 7 días hábiles dependiendo de tu ubicación. Ofrecemos envío estándar y express. Los envíos de cartas importadas pueden tardar hasta 15 días hábiles.',
    },
    {
      question: '¿Cómo garantizan la autenticidad de las cartas?',
      answer:
        'Todas las cartas son verificadas por nuestro equipo de expertos antes de ser enviadas. Utilizamos herramientas de alta precisión para garantizar que recibas un producto 100% auténtico.',
    },
    {
      question: '¿Puedo vender mis cartas en Hydra?',
      answer:
        'Hemos lanzado nuestra nueva plataforma de vendedores. Visita nuestra sección de "Vender" para conocer el proceso detallado y comenzar a certificar tus piezas.',
    },
    {
      question: '¿Hacen envíos internacionales?',
      answer: 'Por el momento solo realizamos envíos dentro del territorio mexicano.',
    },
    {
      question: '¿Cuál es su política de devoluciones?',
      answer:
        'Aceptamos devoluciones si el producto no coincide con la descripción o condición publicada. Tienes 3 días naturales tras recibir tu paquete para iniciar un reclamo.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd id="help-schema" data={jsonLd} />
      <HelpClient />
    </>
  );
}
