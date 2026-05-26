'use client';

import { m } from 'framer-motion';
import { SELL_STEPS } from '../constants';

export function SellProcess() {
  return (
    <section className="py-40 px-6 relative overflow-hidden bg-vault-surface-low/30">
      <div className="absolute top-1/4 left-0 w-full h-[600px] bg-gradient-to-b from-teal/5 via-transparent to-transparent -skew-y-6 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-32">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-6xl font-semibold mb-6 tracking-tight uppercase text-teal">
              Â¿Cómo funciona?
            </h2>
            <div className="h-2 w-32 bg-gold/80 mx-auto rounded-full shadow-[0_0_20px_rgba(var(--color-gold),0.3)]" />
            <p className="mt-8 text-vault-text-muted text-lg font-medium max-w-2xl mx-auto">
              Vender tus piezas en Hydra es un proceso transparente y seguro. Sigue estos pasos y
              nosotros nos encargamos del resto.
            </p>
          </m.div>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-teal/20 to-transparent z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 relative z-10">
            {SELL_STEPS.map((step, stepIdx) => (
              <m.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: stepIdx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-100px' }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left group"
              >
                <div className="relative mb-10">
                  <span className="absolute -top-12 -left-6 text-7xl font-black text-teal/5 select-none pointer-events-none group-hover:text-teal/10 transition-colors duration-500">
                    {step.number}
                  </span>

                  <div className="relative size-24 rounded-[32px] bg-vault-surface-high/50 flex items-center justify-center border border-white/5 shadow-2xl group-hover:border-teal/40 group-hover:shadow-[0_0_30px_rgba(var(--color-teal),0.15)] transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <step.icon className="size-10 text-teal group-hover:text-gold group-hover:scale-110 transition-all duration-500 z-10" />
                  </div>

                  {stepIdx < SELL_STEPS.length - 1 && (
                    <div className="lg:hidden absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-teal/20 to-transparent" />
                  )}
                </div>

                <div className="vault-glass-card p-8 rounded-[40px] border border-white/[0.03] backdrop-blur-sm group-hover:translate-y-[-8px] transition-all duration-500 min-h-[200px] flex flex-col items-center lg:items-start">
                  <h3 className="text-2xl font-semibold mb-4 group-hover:text-teal transition-colors text-balance">
                    {step.title}
                  </h3>
                  <p className="text-vault-text-muted leading-relaxed font-semibold text-base">
                    {step.description}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
