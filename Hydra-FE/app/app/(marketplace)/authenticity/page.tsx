import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';
import { ShieldCheck, ScanLine, Microscope, BadgeCheck, Gem, Fingerprint } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Garantía de Autenticidad | Hydra Collectables',
  description:
    'Garantía de autenticidad de Hydra Collectables. Todas las cartas de Magic: The Gathering verificadas por expertos antes de su envío.',
  keywords: [
    'autenticidad cartas Magic México',
    'cartas MTG originales',
    'verificación cartas Magic',
    'garantía MTG México',
    'cartas Magic auténticas',
    'falsificaciones MTG',
  ],
  alternates: {
    canonical: '/authenticity',
  },
  openGraph: {
    title: 'Garantía de Autenticidad MTG | Hydra Collectables',
    description:
      'Todas las cartas de Magic: The Gathering verificadas por expertos antes de su envío. 100% auténticas.',
    images: ['/opengraph-image'],
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Garantía de Autenticidad MTG | Hydra Collectables',
  description:
    'Proceso detallado de verificación de autenticidad para cartas de Magic: The Gathering en México.',
  image: 'https://hydracollect.com/cat.png',
  author: {
    '@type': 'Organization',
    name: 'Hydra Experts',
    url: 'https://hydracollect.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Hydra Collectables',
    logo: {
      '@type': 'ImageObject',
      url: 'https://hydracollect.com/cat.png',
    },
  },
  datePublished: '2026-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://hydracollect.com/authenticity',
  },
  inLanguage: 'es-MX',
  wordCount: 450,
};

const steps = [
  {
    icon: ScanLine,
    title: 'Inspección Visual',
    description:
      'Cada carta es inspeccionada bajo iluminación controlada para detectar colores, fuentes y bordes fuera de especificación.',
  },
  {
    icon: Microscope,
    title: 'Análisis de Textura',
    description:
      'Verificamos el patrón de rosetas del proceso de impresión offset exclusivo de Wizards of the Coast utilizando lentes de aumento de 60x.',
  },
  {
    icon: Fingerprint,
    title: 'Prueba de Flexibilidad',
    description:
      'Las cartas auténticas tienen una rigidez característica. Realizamos pruebas de flexión para detectar papel incorrecto.',
  },
  {
    icon: BadgeCheck,
    title: 'Validación de Set',
    description:
      'Confirmamos símbolos de edición, números de colección y holofoil stamps contra bases de datos oficiales.',
  },
  {
    icon: Gem,
    title: 'Verificación de Rareza',
    description:
      'Las cartas foil y raras reciben un escrutinio adicional con luz UV y microscopía digital para detectar re-entintado o alteraciones.',
  },
  {
    icon: ShieldCheck,
    title: 'Sello de Aprobación',
    description:
      'Solo las cartas que pasan todos los controles son listadas en nuestra tienda con su estado de condición verificado.',
  },
];

const conditions = [
  { label: 'NM', name: 'Near Mint', description: 'Sin marcas visibles. Estado perfecto.' },
  {
    label: 'LP',
    name: 'Lightly Played',
    description: 'Mínimo desgaste en bordes. Excelente para jugar.',
  },
  {
    label: 'MP',
    name: 'Moderately Played',
    description: 'Desgaste moderado visible. Completamente funcional.',
  },
  {
    label: 'HP',
    name: 'Heavily Played',
    description: 'Desgaste notable. Recomendado con sleeve.',
  },
];

export default function AuthenticityPage() {
  return (
    <div className="bg-background min-h-screen pb-24 lg:pb-12 animate-page-enter">
      <JsonLd id="authenticity-schema" data={articleSchema} />
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--glow-primary-rgb)/0.1),transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <span className="text-primary font-black tracking-[0.2em] text-xs uppercase mb-4 block">
            100% Verificado
          </span>
          <h1 className="text-4xl lg:text-5xl font-semibold text-text-body tracking-tight uppercase leading-tight mb-6">
            Garantía de
            <br />
            <span className="text-primary">Autenticidad</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed max-w-2xl mx-auto">
            Cada carta que llega a tus manos ha pasado por un riguroso proceso de verificación. En
            Hydra Collectables, tu confianza es nuestra prioridad.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 gap-y-16 pb-8">
        {/* Process steps */}
        <section>
          <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-2">
            Nuestro Proceso
          </h2>
          <div className="mt-2 w-10 h-1 bg-gradient-to-r from-primary/60 to-transparent rounded-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div
                key={step.title}
                className="glass-panel rounded-2xl p-6 border border-border-subtle hover:border-primary/30 transition-colors group"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold text-text-body text-base uppercase tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Condition guide */}
        <section>
          <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-2">
            Guía de Condiciones
          </h2>
          <div className="mt-2 w-10 h-1 bg-gradient-to-r from-primary/60 to-transparent rounded-full mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {conditions.map((c) => (
              <div
                key={c.label}
                className="glass-panel rounded-2xl p-5 border border-border-subtle flex items-start gap-4"
              >
                <div className="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-primary font-black text-sm">{c.label}</span>
                </div>
                <div>
                  <p className="font-black text-text-body text-sm uppercase tracking-wide mb-1">
                    {c.name}
                  </p>
                  <p className="text-text-muted text-sm leading-relaxed">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guarantee block */}
        <section className="glass-panel rounded-3xl p-8 lg:p-12 border border-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <BadgeCheck className="size-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4">
              ¿Recibiste algo incorrecto?
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              Si alguna vez recibes una carta que no cumple con lo descrito, te la reponemos o
              reembolsamos sin preguntas. Así de simple.
            </p>
            <div className="flex flex-col items-center gap-6 mb-8 p-6 rounded-2xl bg-primary/[0.02] border border-primary/5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20">
                  H
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">
                    Verificado por
                  </p>
                  <p className="text-sm font-bold text-text-body">Hydra Expert Panel</p>
                </div>
              </div>
              <p className="text-[11px] text-text-muted italic max-w-sm">
                &ldquo;Nuestro equipo acumula más de 15 años de experiencia en el mercado secundario
                de MTG, garantizando que cada pieza sea 100% legítima.&rdquo;
              </p>
            </div>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Contactar Soporte
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
