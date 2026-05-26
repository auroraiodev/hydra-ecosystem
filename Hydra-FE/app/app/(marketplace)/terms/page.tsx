import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Hydra Collectables México',
  description:
    'Términos y condiciones de uso de Hydra Collectables. Reglas para la compraventa de cartas Magic: The Gathering en México.',
  keywords: [
    'términos y condiciones Hydra Collectables',
    'políticas compraventa MTG México',
    'términos uso tienda Magic Monterrey',
    'contrato marketplace MTG',
  ],
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Términos y Condiciones de Uso | Hydra Collectables',
    description:
      'Reglas y políticas que rigen el uso de la plataforma Hydra Collectables para la compraventa de coleccionables.',
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
      {}
      <JsonLd id="terms-schema" data={articleSchema} />

      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-semibold text-text-body tracking-tight uppercase leading-tight mb-6">
          Términos y <br />
          <span className="text-primary underline decoration-primary/20">Condiciones</span>
        </h1>
        <div className="h-1.5 w-24 bg-primary/60 mx-auto rounded-full mb-8" />
      </div>

      <div className="glass-panel rounded-[32px] border border-border-subtle shadow-2xl p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 gap-y-12 text-text-muted leading-relaxed">
          <p className="text-xl font-medium">
            Bienvenido a <span className="text-primary font-bold">Hydra Collectables</span>. Al
            acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y
            condiciones que rigen nuestra relación comercial.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">01.</span> Aceptación de los Términos
            </h2>
            <p>
              El acceso a este sitio web implica la aceptación de los presentes Términos y
              Condiciones. Si no estás de acuerdo con alguna parte de estos términos, te
              recomendamos no utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">02.</span> Registro y Cuentas
            </h2>
            <p>
              Para realizar compras o ventas en Hydra Collectables, es necesario crear una cuenta.
              Eres responsable de mantener la confidencialidad de tus datos de acceso y de todas las
              actividades que ocurran bajo tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">03.</span> Marketplace y Transacciones
            </h2>
            <p>
              Hydra Collectables actúa como un marketplace que facilita la conexión entre
              compradores y vendedores de cartas de colección. Aunque verificamos la autenticidad de
              las piezas, las transacciones finales están sujetas a la disponibilidad de stock de
              los vendedores asociados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">04.</span> Precios y Pagos
            </h2>
            <p>
              Todos los precios se muestran en pesos mexicanos (MXN). Utilizamos procesadores de
              pago seguros como Mercado Pago para garantizar la protección de tus datos financieros.
              Hydra Collectables se reserva el derecho de cancelar órdenes en caso de errores
              evidentes en el precio de mercado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">05.</span> Propiedad Intelectual
            </h2>
            <p>
              Todo el contenido del sitio, incluyendo logos, diseños y textos, es propiedad de Hydra
              Collectables. Magic: The Gathering y sus marcas asociadas son propiedad de Wizards of
              the Coast LLC. El uso de Hydra Collectables no otorga derechos sobre dichas marcas.
            </p>
          </section>

          <div className="pt-8 border-t border-white/5">
            <p className="text-xs uppercase tracking-widest font-black opacity-30">
              Última actualización: 22 de Abril, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
