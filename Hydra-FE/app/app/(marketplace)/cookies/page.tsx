import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';

export const metadata: Metadata = {
  title: 'Política de Cookies | Hydra Collectables México',
  description:
    'Política de cookies de Hydra Collectables. Conoce cómo utilizamos cookies para mejorar tu experiencia de navegación y seguridad.',
  keywords: [
    'cookies Hydra Collectables',
    'política cookies tienda Magic',
    'uso cookies MTG México',
  ],
  alternates: {
    canonical: '/cookies',
  },
};

export default function CookiesPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Política de Cookies | Hydra Collectables',
    description:
      'Explicación del uso de cookies y tecnologías similares para mejorar la experiencia del usuario en Hydra Collectables.',
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
      <JsonLd id="cookies-schema" data={articleSchema} />

      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-semibold text-text-body tracking-tight uppercase leading-tight mb-6">
          Política de <br />
          <span className="text-primary underline decoration-primary/20">Cookies</span>
        </h1>
        <div className="h-1.5 w-24 bg-primary/60 mx-auto rounded-full mb-8" />
      </div>

      <div className="glass-panel rounded-[32px] border border-border-subtle shadow-2xl p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 gap-y-12 text-text-muted leading-relaxed">
          <p className="text-xl font-medium">
            En <span className="text-primary font-bold">Hydra Collectables</span> utilizamos cookies
            y tecnologías similares para garantizar que nuestro marketplace funcione correctamente y
            para entender cómo lo utilizas.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">01.</span> ¿Qué son las Cookies?
            </h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
              visitas un sitio web. Ayudan al sitio a recordar información sobre tu visita, como tu
              idioma preferido y otras configuraciones.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">02.</span> Tipos de Cookies que Utilizamos
            </h2>
            <ul className="gap-y-4">
              <li className="flex gap-3">
                <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>
                  <strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico de
                  la tienda, como mantener el carrito de compras y la sesión de usuario.
                </span>
              </li>
              <li className="flex gap-3">
                <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>
                  <strong>Cookies de Análisis:</strong> Nos ayudan a medir el rendimiento de la
                  página y entender qué secciones son las más populares.
                </span>
              </li>
              <li className="flex gap-3">
                <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>
                  <strong>Cookies de Preferencia:</strong> Permiten que el sitio recuerde tus
                  elecciones (como el modo oscuro o filtros de búsqueda).
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">03.</span> Control de Cookies
            </h2>
            <p>
              Puedes controlar y/o borrar las cookies en cualquier momento a través de la
              configuración de tu navegador. Sin embargo, ten en cuenta que deshabilitar las cookies
              esenciales puede impedir el uso de ciertas funciones del marketplace.
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
