'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Mail,
  User,
  MessageCircle,
  Clock,
  ArrowRight,
  HelpCircle,
  Package,
  CheckCircle2,
} from 'lucide-react';

const categories = [
  {
    id: 'orders',
    title: 'Pedidos y Pagos',
    icon: CreditCard,
    description: 'Compras, pagos y facturacion',
    articles: 12,
  },
  {
    id: 'shipping',
    title: 'Envios',
    icon: Truck,
    description: 'Rastreo y tiempos de entrega',
    articles: 8,
  },
  {
    id: 'returns',
    title: 'Devoluciones',
    icon: RotateCcw,
    description: 'Reembolsos y garantias',
    articles: 6,
  },
  {
    id: 'account',
    title: 'Mi Cuenta',
    icon: User,
    description: 'Perfil y configuracion',
    articles: 10,
  },
  {
    id: 'authenticity',
    title: 'Autenticidad',
    icon: ShieldCheck,
    description: 'Verificacion de cartas',
    articles: 5,
  },
  {
    id: 'selling',
    title: 'Vender',
    icon: Package,
    description: 'Como vender tus cartas',
    articles: 7,
  },
];

const faqs = [
  {
    category: 'orders',
    question: 'Como compro cartas en Hydra Collectables?',
    answer:
      'Busca la carta que deseas, agregala al carrito y procede al checkout. Aceptamos multiples metodos de pago, incluyendo tarjetas bancarias, transferencia y Google Pay.',
  },
  {
    category: 'shipping',
    question: 'Cuanto tarda el envio?',
    answer:
      'Los envios dentro de Mexico tardan entre 3 a 7 dias habiles dependiendo de tu ubicacion. Ofrecemos envio estandar y express. Los envios de cartas importadas pueden tardar hasta 15 dias habiles.',
  },
  {
    category: 'authenticity',
    question: 'Como garantizan la autenticidad de las cartas?',
    answer:
      'Todas las cartas son verificadas por nuestro equipo de expertos antes de ser enviadas. Utilizamos herramientas de alta precision para garantizar que recibas un producto 100% autentico.',
  },
  {
    category: 'orders',
    question: 'Puedo vender mis cartas en Hydra?',
    answer:
      'Hemos lanzado nuestra nueva plataforma de vendedores. Visita nuestra seccion de "Vender" para conocer el proceso detallado y comenzar a certificar tus piezas.',
  },
  {
    category: 'shipping',
    question: 'Hacen envios internacionales?',
    answer: 'Por el momento solo realizamos envios dentro del territorio mexicano.',
  },
  {
    category: 'returns',
    question: 'Cual es su politica de devoluciones?',
    answer:
      'Aceptamos devoluciones si el producto no coincide con la descripcion o condicion publicada. Tienes 3 dias naturales tras recibir tu paquete para iniciar un reclamo.',
  },
];

const popularArticles = [
  { title: 'Como rastrear mi pedido', category: 'Envios' },
  { title: 'Metodos de pago aceptados', category: 'Pagos' },
  { title: 'Proceso de verificacion de cartas', category: 'Autenticidad' },
  { title: 'Como iniciar una devolucion', category: 'Devoluciones' },
];

export default function HelpClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent" />
        <div className="absolute top-0 right-0 size-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
                <Image
                  src="/cat.png"
                  alt="Hydra Help"
                  width={64}
                  height={64}
                  className="relative z-10"
                />
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-semibold text-zinc-900 mb-4 tracking-tight">
              Centro de Ayuda
            </h1>
            <p className="text-zinc-800 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Encuentra respuestas rapidas o contacta a nuestro equipo de soporte
            </p>

            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar en el centro de ayuda..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-16 -mt-4">
          <div className="flex items-center gap-2 text-sm text-zinc-800">
            <Clock className="size-4 text-primary" />
            <span>Respuesta en menos de 24h</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-800">
            <CheckCircle2 className="size-4 text-primary" />
            <span>98% de satisfaccion</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-800">
            <HelpCircle className="size-4 text-primary" />
            <span>+50 articulos de ayuda</span>
          </div>
        </div>

        {/* Categories Grid */}
        {!searchQuery && (
          <section className="mb-16">
            <h2 className="text-xl font-semibold text-zinc-900 mb-6">Explorar por categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                    className={`group text-left p-5 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-white border-zinc-200 hover:border-primary/20 hover:bg-zinc-50'
                    }`}
                  >
                    <div
                      className={`size-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-zinc-100 text-zinc-800 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}
                    >
                      <cat.icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-1">{cat.title}</h3>
                    <p className="text-sm text-zinc-700">{cat.description}</p>
                    <span className="text-xs text-zinc-400 mt-2 block">
                      {cat.articles} articulos
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQs Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Preguntas Frecuentes
                  {activeCategory && (
                    <span className="ml-2 text-sm font-normal text-primary">
                      ({categories.find((c) => c.id === activeCategory)?.title})
                    </span>
                  )}
                </h2>
              </div>

              {filteredFaqs.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {filteredFaqs.map((faq, faqIdx) => (
                    <div key={faq.question}>
                      <button
                        onClick={() => setOpenFaq(openFaq === faqIdx ? null : faqIdx)}
                        className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-zinc-50 transition-colors"
                      >
                        <span className="font-medium text-zinc-900 pr-8 leading-relaxed">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`size-5 text-zinc-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                            openFaq === faqIdx ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          openFaq === faqIdx ? 'max-h-48' : 'max-h-0'
                        }`}
                      >
                        <p className="px-6 pb-5 text-zinc-800 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="size-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="size-5 text-zinc-400" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-2">No encontramos resultados</h3>
                  <p className="text-sm text-zinc-700">
                    Intenta con otras palabras o{' '}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory(null);
                      }}
                      className="text-primary hover:underline"
                    >
                      ver todas las preguntas
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="gap-y-6">
            {/* Popular Articles */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">Articulos populares</h3>
              <ul className="gap-y-3">
                {popularArticles.map((article) => (
                  <li key={article.title}>
                    <Link href="#" className="flex items-start gap-3 group">
                      <ArrowRight className="size-4 text-zinc-300 mt-0.5 group-hover:text-primary transition-colors" />
                      <div>
                        <span className="text-sm text-zinc-700 group-hover:text-primary transition-colors">
                          {article.title}
                        </span>
                        <span className="text-xs text-zinc-400 block">{article.category}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Support Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/10">
              <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">No encuentras lo que buscas?</h3>
              <p className="text-sm text-zinc-800 mb-4">
                Nuestro equipo de soporte esta listo para ayudarte
              </p>
              <Link
                href="mailto:soporte@hydracollectables.com"
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail className="size-4" />
                Contactar soporte
              </Link>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">Nuestras garantias</h3>
              <ul className="gap-y-4">
                <li className="flex items-start gap-3">
                  <div className="size-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-zinc-900 block">Compra Segura</span>
                    <span className="text-xs text-zinc-700">
                      Proteccion en todas tus transacciones
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-zinc-900 block">
                      Envio Rastreable
                    </span>
                    <span className="text-xs text-zinc-700">Seguimiento en tiempo real</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-zinc-900 block">100% Autentico</span>
                    <span className="text-xs text-zinc-700">Verificado por expertos</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
