import { Metadata } from 'next';
import { JsonLd } from '@/features/shared/components/JsonLd';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Hydra Collectables México',
  description:
    'Política de privacidad de Hydra Collectables. Conoce cómo protegemos y tratamos tus datos personales en nuestro marketplace de MTG.',
  keywords: [
    'privacidad Hydra Collectables',
    'protección datos personales México',
    'aviso de privacidad MTG',
    'seguridad datos marketplace',
  ],
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Política de Privacidad | Hydra Collectables',
    description:
      'Detalle del tratamiento de datos personales y medidas de seguridad implementadas en la plataforma Hydra Collectables.',
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
      <JsonLd id="privacy-schema" data={articleSchema} />

      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-semibold text-text-body tracking-tight uppercase leading-tight mb-6">
          Política de <br />
          <span className="text-primary underline decoration-primary/20">Privacidad</span>
        </h1>
        <div className="h-1.5 w-24 bg-primary/60 mx-auto rounded-full mb-8" />
      </div>

      <div className="glass-panel rounded-[32px] border border-border-subtle shadow-2xl p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 gap-y-12 text-text-muted leading-relaxed">
          <p className="text-xl font-medium">
            En <span className="text-primary font-bold">Hydra Collectables</span>, valoramos tu
            confianza y nos comprometemos a proteger tu privacidad. Este aviso describe cómo
            recopilamos, usamos y resguardamos tu información personal.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">01.</span> Información que Recopilamos
            </h2>
            <p>
              Recopilamos información necesaria para procesar tus órdenes y mejorar tu experiencia:
              nombre, dirección de envío, correo electrónico y detalles de contacto. No almacenamos
              datos sensibles de tarjetas bancarias en nuestros servidores; estos son procesados
              directamente por entidades financieras certificadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">02.</span> Uso de la Información
            </h2>
            <p>
              Tus datos se utilizan para: gestionar tus pedidos, comunicarte el estado de tus
              envíos, brindar soporte técnico y, si así lo autorizas, enviarte promociones y
              novedades sobre el mercado de Magic: The Gathering.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">03.</span> Protección y Seguridad
            </h2>
            <p>
              Implementamos protocolos de seguridad industrial (SSL/TLS) para cifrar la
              transferencia de datos. El acceso a tu información personal está restringido
              únicamente a personal autorizado necesario para completar tus transacciones.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">04.</span> Derechos ARCO
            </h2>
            <p>
              De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares (México), tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al
              tratamiento de tus datos personales. Puedes ejercer estos derechos enviando un correo
              a privacidad@hydracollectables.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-text-body uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="text-primary/40 text-sm">05.</span> Uso de Cookies
            </h2>
            <p>
              Utilizamos cookies esenciales para mantener tu sesión activa y cookies de análisis
              para entender cómo interactúas con nuestra plataforma. Puedes desactivarlas en la
              configuración de tu navegador, aunque esto podría afectar la funcionalidad de la
              tienda.
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
