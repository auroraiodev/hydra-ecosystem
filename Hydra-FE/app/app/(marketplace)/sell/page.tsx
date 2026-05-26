import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';
import SellClient from './SellClient';

export const metadata: Metadata = {
  title: 'Vende tus Cartas Magic: The Gathering | Marketplace MTG México - Hydra',
  description:
    'Vende tus cartas de Magic The Gathering (solo cierta región del país) de forma segura. Comisión fija del 12%, revisión experta y pagos garantizados.',
  alternates: {
    canonical: '/sell',
  },
  openGraph: {
    title: 'Vende tus Cartas MTG con Hydra Collectables',
    description:
      'Marketplace para vender tus cartas Magic: The Gathering (cierta región del país) con comisión del 12%.',
    type: 'website',
  },
};

export default function SellPage() {
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cómo vender tus cartas Magic en Hydra Collectables',
    description: 'Proceso paso a paso para vender tus singles y producto sellado de MTG.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Prepara tus cartas',
        text: 'Revisa tus singles o producto sellado. Confirma que estén en buen estado.',
        url: 'https://hydracollect.com/sell#step1',
      },
      {
        '@type': 'HowToStep',
        name: 'Envía tu lista',
        text: 'Llena el formulario con lo que quieres vender para que estemos listos.',
        url: 'https://hydracollect.com/sell#step2',
      },
      {
        '@type': 'HowToStep',
        name: 'Mándalo a Hydra',
        text: 'Enviamos tus cartas y procesamos los pagos de forma segura.',
        url: 'https://hydracollect.com/sell#step3',
      },
      {
        '@type': 'HowToStep',
        name: 'Evaluación',
        text: 'Revisamos autenticidad y estado físico de cada pieza recibida.',
        url: 'https://hydracollect.com/sell#step4',
      },
      {
        '@type': 'HowToStep',
        name: 'Pago tras Venta',
        text: 'Recibe tu dinero una vez que los artículos sean validados.',
        url: 'https://hydracollect.com/sell#step5',
      },
    ],
    totalTime: 'P3D',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'MXN',
      value: '0',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué puedo vender?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cualquier carta de Magic: The Gathering (singles) o producto sellado. Actualmente el servicio está limitado a cierta región del país.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto es la comisión?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La comisión es del 12% sobre el precio final de venta.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuándo me pagan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Te pagamos en cuanto tus piezas se vendan en nuestro marketplace.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo envían mis cartas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nosotros nos encargamos del empaque y envío al comprador final una vez realizada la venta.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd id="howto-schema" data={howToSchema} />
      <JsonLd id="faq-schema" data={faqSchema} />
      <SellClient />
    </>
  );
}
