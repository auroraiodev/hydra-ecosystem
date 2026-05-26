import Link from 'next/link';
import { Package, Truck, Trophy, Star } from 'lucide-react';
import { JsonLd } from '@/features/shared/components/JsonLd';

import type { Review } from '@/lib/api/reviews';

import type { Tcg } from '@/lib/types/tcg';
import { SOCIAL_LINKS } from '@/lib/metadata';

const EMPTY_REVIEWS: Review[] = [];

export function HomeSEOContent({
  reviews = EMPTY_REVIEWS,
}: {
  reviews?: Review[];
  activeTcgs?: Tcg[];
}) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Hydra Collectables - Magic The Gathering',
    alternateName: [
      'Hydra MTG',
      'MTG Mexico',
      'Pokemon Mexico',
      'Digimon Mexico',
      'Digimon TCG Mexico',
      'Dragon Ball TCG Mexico',
      'Pokemon TCG Mexico',
      'Magic Mexico',
      'Magic The Gathering Mexico',
      'Tienda MTG Mexico',
      'Tienda Pokemon Mexico',
      'Tienda Digimon Mexico',
      'Tienda Dragon Ball Mexico',
      'Tienda Magic Mexico',
      'Tienda Magic The Gathering Mexico',
      'Tienda MTG Mexico',
      'Comprar Magic The Gathering Mexico',
      'Comprar Pokemon Mexico',
      'Comprar Digimon Mexico',
      'Comprar Dragon Ball Mexico',
      'Comprar Magic Mexico',
      'Comprar Magic The Gathering Mexico',
      'Comprar MTG Mexico',
      'TCG Mexico',
      'TCG Monterrey',
      'TCG Nuevo Leon',
      'TCG Guadalajara',
      'TCG Mexico City',
    ],
    url: 'https://hydracollect.com',
    logo: 'https://hydracollect.com/cat.png',
    description:
      'La tienda #1 de Magic The Gathering en Mexico. +10,000 cartas MTG disponibles con envio a toda la Republica Mexicana.',
    slogan: 'Tu destino #1 para Magic The Gathering en México',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MX',
    },
    areaServed: 'MX',
    priceRange: '$$',
    currenciesAccepted: 'MXN',
    sameAs: SOCIAL_LINKS,
  };

  // Removed duplicate WebSite schema (defined in RootLayout)

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);

    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: '5',
      worstRating: '1',
    };

    jsonLd.review = reviews.slice(0, 3).map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: `${r.user?.first_name || 'Gamer'} ${r.user?.last_name || ''}`.trim(),
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating || 5,
      },
      reviewBody: r.comment || '',
      datePublished: r.created_at || new Date().toISOString(),
    }));
  }

  return (
    <>
      <JsonLd id="schema-org" data={jsonLd} />
      <h2 className="sr-only">Hydra Collectables - Tu Tienda de Magic The Gathering en México</h2>

      {/* Sell Section CTA */}
      <div className="px-4 lg:px-0 mt-16 mb-8 relative group">
        <div className="absolute inset-0 bg-teal/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative vault-glass-panel rounded-[2rem] p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal/10 to-transparent pointer-events-none" />
          <div className="max-w-2xl text-center lg:text-left">
            <span className="text-teal font-black tracking-[0.2em] text-xs uppercase mb-4 block">
              Centro de Vendedores
            </span>
            <h2 className="text-3xl lg:text-5xl font-semibold text-white mb-6 tracking-tighter leading-tight uppercase">
              Â¿Tienes cartas que <br />
              <span className="text-teal">no usas?</span>
            </h2>
            <p className="text-vault-text-muted text-lg font-medium leading-relaxed mb-8 max-w-xl">
              Las vendemos por ti. Envíanos tus singles o colecciones (solo MTG y cierta región del
              país por ahora), las listamos en la tienda y te pagamos una vez que se vendan.
              Comisión fija del 12%, sin sorpresas.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/sell"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold bg-teal text-teal-foreground rounded-xl shadow-xl shadow-teal/20 hover:opacity-90 transition-opacity"
              >
                Empezar a Vender
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl border border-white/10 text-white hover:bg-white/10 hover:text-white transition-colors"
              >
                Ver Guía de Precios
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="px-4 lg:px-0 mt-16 mb-12">
        <div className="vault-glass-panel border border-white/10 rounded-3xl p-6 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-96 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="max-w-4xl mx-auto mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-6xl font-semibold text-white mb-6 tracking-tighter uppercase leading-none">
                  El Epicentro de <br />
                  <span className="text-teal">Magic: The Gathering</span> en México
                </h2>
                <div className="w-24 h-1 bg-teal/20 mx-auto rounded-full mb-8" />
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div className="gap-y-6">
                  <p className="text-xl text-white font-bold leading-tight">
                    Bienvenido a <span className="text-teal">Hydra Collectables</span>, el destino
                    definitivo para la comunidad de{' '}
                    <span className="underline decoration-teal/30 underline-offset-4">
                      MTG México
                    </span>
                    .
                  </p>
                  <p className="text-vault-text-muted leading-relaxed text-lg">
                    Con un inventario que supera las{' '}
                    <span className="text-white font-bold">10,000 cartas</span>, nos consolidamos
                    como la tienda especializada líder, ofreciendo singles, sellado y accesorios con
                    envíos seguros a cada rincón de la República.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Commander', 'Modern', 'Standard', 'Pioneer', 'Legacy', 'cEDH'].map(
                      (format) => (
                        <span
                          key={format}
                          className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-vault-text-muted uppercase tracking-wider"
                        >
                          {format}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="vault-glass-panel border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-teal/30 transition-colors">
                  <div className="absolute -right-4 -top-4 size-24 bg-teal/5 rounded-full blur-2xl group-hover:bg-teal/10 transition-colors" />
                  <h3 className="text-sm font-semibold text-teal uppercase tracking-[0.2em] mb-4">
                    Presencia Nacional
                  </h3>
                  <p className="text-vault-text-muted leading-relaxed mb-6">
                    Orgullosos de servir a los coleccionistas de todo México. Enviamos diariamente a
                    cada rincón de la República con la máxima seguridad y rapidez.
                  </p>
                  <p className="mt-8 text-sm text-vault-text-muted border-t border-white/10 pt-4">
                    &ldquo;Más que una tienda, somos tu aliado en el campo de batalla.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
              <div className="vault-glass-panel border border-white/10 p-8 rounded-2xl hover:shadow-lg transition-shadow group">
                <div className="size-14 bg-teal/10 rounded-2xl flex items-center justify-center mb-6 text-teal group-hover:scale-110 transition-transform">
                  <Package className="size-7" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">+10,000 Cartas MTG Mexico</h3>
                <p className="text-vault-text-muted text-sm leading-relaxed">
                  El inventario mas grande de cartas Magic The Gathering en Mexico. Singles,
                  sellado, Commander precons y accesorios.
                </p>
              </div>
              <div className="vault-glass-panel border border-white/10 p-8 rounded-2xl hover:shadow-lg transition-shadow group">
                <div className="size-14 bg-teal/10 rounded-2xl flex items-center justify-center mb-6 text-teal group-hover:scale-110 transition-transform">
                  <Truck className="size-7" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Envio a Todo Mexico</h3>
                <p className="text-vault-text-muted text-sm leading-relaxed">
                  Envios diarios a toda la Republica Mexicana via FedEx, Estafeta y DHL. Siempre con
                  empaque profesional y seguro.
                </p>
              </div>
              <div className="vault-glass-panel border border-white/10 p-8 rounded-2xl hover:shadow-lg transition-shadow group md:col-span-2 lg:col-span-1">
                <div className="size-14 bg-teal/10 rounded-2xl flex items-center justify-center mb-6 text-teal group-hover:scale-110 transition-transform">
                  <Trophy className="size-7" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Precios en Pesos Mexicanos
                </h3>
                <p className="text-vault-text-muted text-sm leading-relaxed">
                  Todos nuestros precios estan en MXN. Sin sorpresas de tipo de cambio. La mejor
                  tienda MTG Mexico.
                </p>
              </div>
            </div>

            {/* Testimonials */}
            {reviews.length > 0 && (
              <div className="mb-20">
                <h3 className="text-3xl font-semibold text-white mb-10 text-center tracking-tighter uppercase">
                  Voces de la Comunidad
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {reviews.map((review: Review) => (
                    <div
                      key={review.id}
                      className="vault-glass-panel border border-white/10 p-8 rounded-3xl"
                    >
                      <div className="flex text-gold mb-6">
                        {[...Array(review.rating)].map((_, j) => (
                          <Star key={j} className="size-5 fill-current" />
                        ))}
                      </div>
                      <p className="text-vault-text-muted text-base mb-6">
                        &quot;{review.comment}&quot;
                      </p>
                      <span className="text-white font-black text-sm uppercase">
                        : {review.user.first_name} {review.user.last_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
