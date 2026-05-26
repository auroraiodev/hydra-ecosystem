import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';

export const metadata: Metadata = {
  title: 'Política de Devoluciones | Hydra Collectables México',
  description:
    'Política de devoluciones de Hydra Collectables. Conoce los términos, plazos y condiciones para reembolsos de cartas MTG en México y Monterrey.',
  keywords: [
    'devoluciones Hydra Collectables',
    'reembolso cartas Magic México',
    'política devolución MTG',
    'devolver cartas sueltas',
    'garantía compra Magic México',
    'MTG Monterrey devoluciones',
  ],
  alternates: {
    canonical: '/returns',
  },
  openGraph: {
    title: 'Política de Devoluciones | Hydra Collectables',
    description:
      'Conoce los términos, plazos y condiciones para la devolución y reembolso de cartas de Magic: The Gathering.',
    images: ['/opengraph-image'],
  },
};

export default function ReturnsPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Política de Devoluciones y Reembolsos | Hydra Collectables',
    description:
      'Términos y condiciones para la devolución de singles y producto sellado de Magic: The Gathering.',
    author: {
      '@type': 'Organization',
      name: 'Hydra Collectables',
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
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-page-enter">
      <JsonLd id="returns-schema" data={articleSchema} />

      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-semibold text-text-body tracking-tight uppercase leading-tight mb-6">
          Política de <br />
          <span className="text-primary underline decoration-primary/20">Devoluciones</span>
        </h1>
        <div className="h-1.5 w-24 bg-primary/60 mx-auto rounded-full mb-8" />
      </div>

      <div className="glass-panel rounded-[32px] border border-border-subtle shadow-2xl p-8 lg:p-12 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 prose prose-invert max-w-none">
          <p className="lead text-text-muted text-xl font-medium mb-12 leading-relaxed">
            En <span className="text-primary font-bold">Hydra Collectables</span> nuestro objetivo
            es brindarte la mejor experiencia al adquirir tus cartas de{' '}
            <strong className="text-text-body">Magic: The Gathering</strong>. Al ser mercancía de
            colección, nuestras políticas están diseñadas para garantizar la seguridad de todos
            nuestros usuarios.
          </p>

          <div className="gap-y-12">
            <section>
              <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-6 flex items-center gap-3">
                <span className="text-primary/40">01.</span> Devolución de Singles
              </h2>
              <p className="text-text-muted mb-4 text-lg">
                Aceptamos devoluciones de singles{' '}
                <strong className="text-primary">exclusivamente</strong> en los siguientes casos:
              </p>
              <ul className="gap-y-4 text-text-muted text-lg list-none pl-0">
                <li className="flex gap-3">
                  <div className="size-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span>
                    <strong>Discrepancia de condición (Condition):</strong> Si la carta que
                    recibiste no coincide con el estado (NM, LP, MP, HP, DMG) o idioma descrito en
                    la publicación.
                  </span>
                </li>
                <li className="flex gap-3">
                  <div className="size-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span>
                    <strong>Error de envío:</strong> Si recibiste una carta, edición, idioma o
                    versión (Foil, Etched, etc.) diferente a la que solicitaste en tu pedido.
                  </span>
                </li>
              </ul>
              <div className="mt-8 p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                <p className="text-red-400 font-bold italic text-sm">
                  No se aceptarán devoluciones por &ldquo;arrepentimiento de compra&rdquo; o cambios
                  en el precio del mercado posterior a la transacción.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-6 flex items-center gap-3">
                <span className="text-primary/40">02.</span> Producto Sellado y Accesorios
              </h2>
              <p className="text-text-muted mb-6 text-lg leading-relaxed">
                Sólo aceptaremos devoluciones de productos sellados (Booster Boxes, Commander Decks,
                Bundles, Micas, Carpetas) siempre y cuando cumplan estos requisitos:
              </p>
              <ul className="gap-y-4 text-text-muted text-lg list-none pl-0">
                <li className="flex gap-3">
                  <div className="size-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span>
                    El producto debe estar en su empaque <strong>completamente cerrado</strong> con
                    su celofán o sellos de fábrica originales intactos.
                  </span>
                </li>
                <li className="flex gap-3">
                  <div className="size-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span>
                    No mostrar indicios de manipulación, golpes o daño estructural al interior.
                  </span>
                </li>
              </ul>
              <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-amber-400 font-bold text-sm">
                  Si el empaque de fábrica ha sido removido, abierto o alterado, la venta se
                  considera final y no será posible emitir una devolución o reembolso.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-6 flex items-center gap-3">
                <span className="text-primary/40">03.</span> Proceso para Solicitar un Reembolso
              </h2>
              <p className="text-text-muted mb-8 text-lg">
                Cuentas con un máximo de <strong>3 días naturales</strong> a partir de la recepción
                de tu paquete para notificar cualquier problema.
              </p>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 rounded-3xl bg-surface-container-high border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-6xl font-black">VIDEO</span>
                  </div>
                  <h4 className="text-lg font-semibold text-text-body uppercase mb-4">
                    Unboxing Obligatorio
                  </h4>
                  <p className="text-text-muted leading-relaxed">
                    Para validar reclamos por condición o autenticidad, es{' '}
                    <strong>obligatorio</strong> enviar un video ininterrumpido abriendo tu paquete
                    con buena iluminación.
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-surface-container-high border border-white/5">
                  <h4 className="text-lg font-semibold text-text-body uppercase mb-4">
                    Notificación Directa
                  </h4>
                  <p className="text-text-muted leading-relaxed">
                    Contacta a soporte@hydracollectables.com o mediante el chat de la plataforma
                    adjuntando el video y fotos detalladas de tu número de orden.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
