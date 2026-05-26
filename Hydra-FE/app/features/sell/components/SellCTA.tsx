'use client';

import { m } from 'framer-motion';
import Image from 'next/image';
import { FlowButton } from '@/features/shared/ui/flow-button';

export function SellCTA() {
  return (
    <section className="py-40 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-teal/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <m.div
        className="max-w-4xl mx-auto p-12 sm:p-24 vault-glass-panel rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col items-center text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        <div className="relative z-10">
          <m.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Image
              src="/cat.png"
              alt="Hydra"
              width={160}
              height={160}
              className="mx-auto mb-10 object-contain drop-shadow-2xl"
            />
          </m.div>

          <h2 className="text-5xl sm:text-7xl font-semibold mb-8 tracking-tighter leading-none uppercase text-vault-text">
            ¿Listo para <span className="text-teal underline decoration-gold/30">empezar</span>?
          </h2>

          <p className="text-xl sm:text-2xl text-vault-text-muted mb-16 max-w-xl mx-auto leading-relaxed font-black text-balance">
            Nuestros especialistas están listos para recibir tus cartas.{' '}
            <br className="hidden sm:block" />
            Tú solo envías, nosotros nos encargamos del resto.
          </p>

          <div className="flex flex-col items-center gap-8 w-full">
            <FlowButton
              size="lg"
              className="px-16 h-20 text-xl font-black rounded-full shadow-[0_20px_40px_-10px_rgba(var(--color-teal),0.3)] hover:shadow-[0_25px_50px_-10px_rgba(var(--color-teal),0.4)] transition-all"
              showArrows
            >
              HABLAR POR WHATSAPP
            </FlowButton>

            <div className="flex items-center gap-4 text-xs font-black text-vault-text-muted uppercase tracking-[0.2em]">
              <span className="w-12 h-[1px] bg-white/10" />
              <span>Sin costos de listado</span>
              <span className="w-12 h-[1px] bg-white/10" />
            </div>
          </div>
        </div>
      </m.div>
    </section>
  );
}
