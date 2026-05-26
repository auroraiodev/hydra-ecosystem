'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: '¿Cómo comprar cartas Magic en Hydra Collectables?',
    answer:
      'Navega por nuestro catálogo, selecciona las cartas que necesitas, agrégalas al carrito y finaliza tu compra. Aceptamos pagos con tarjeta, transferencia y Mercado Pago. Enviamos a toda la República Mexicana.',
  },
  {
    question: '¿Hacen envíos a toda la República?',
    answer:
      'Sí, realizamos envíos a todo México. El costo y tiempo de entrega varía según tu ubicación.',
  },
  {
    question: '¿Qué condiciones de carta manejan?',
    answer:
      'Aceptamos cartas en todas las condiciones. Cada carta tiene su condición especificada en la descripción del producto para que sepas exactamente en qué estado está antes de comprar.',
  },
  {
    question: '¿Puedo vender mis cartas a través de Hydra?',
    answer:
      '¡Claro! Nuestro Centro de Vendedores te permite vender singles y colecciones de Magic: The Gathering. Actualmente solo aceptamos cartas de ciertas regiones. Cobramos una comisión fija del 12% sin costos ocultos. Nos encargamos del almacenamiento, fotografía y envío.',
  },
  {
    question: '¿Los precios están en pesos mexicanos?',
    answer:
      'Sí, todos nuestros precios son en MXN (pesos mexicanos). No hay cargos sorpresa por conversión de moneda.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-16 sm:py-20 bg-vault-bg">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-teal uppercase tracking-wider">Soporte</span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-2">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm text-vault-text-muted mt-2">
            Todo lo que necesitas saber sobre comprar y vender en Hydra.
          </p>
        </div>
        <div className="flex flex-col gap-y-3">
          {faqs.map((faq, i: number) => (
            <div key={faq.question} className="relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-300 ${
                  openIndex === i ? 'bg-teal opacity-100' : 'bg-transparent opacity-0'
                }`}
              />
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left vault-glass-card rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-sm sm:text-base font-medium text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`size-5 text-teal shrink-0 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 sm:px-6 pb-4 pt-2">
                  <p className="text-sm text-vault-text-muted leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
