'use client';

import { m } from 'framer-motion';
import Image from 'next/image';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { type SellHeroProps } from '../types/Sell.types';
import { SELL_COMMISSION_PERCENT, SELL_CATEGORY_LIMIT } from '../constants';

const CardFan = () => {
  const cards = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center translate-y-16 lg:translate-y-24">
      {cards.map((cardIndex) => {
        const rotate = (cardIndex - 3) * 15;
        const x = (cardIndex - 3) * 35;
        const y = Math.abs(cardIndex - 3) * 12;

        return (
          <m.div
            key={`card-${cardIndex}`}
            className="absolute w-[180px] h-[252px] rounded-[11px] overflow-hidden cursor-pointer"
            initial={{ opacity: 0, y: 100, rotate: 0, x: 0 }}
            whileInView={{ opacity: 1, y: y, rotate: rotate, x: x }}
            transition={{
              duration: 0.8,
              delay: cardIndex * 0.1,
              type: 'spring',
              stiffness: 100,
              damping: 20,
            }}
            whileHover={{
              y: y - 50,
              scale: 1.1,
              zIndex: 50,
              transition: { duration: 0.3 },
            }}
            viewport={{ once: true }}
            style={{
              zIndex: 10 + cardIndex,
              transformOrigin: 'bottom center',
            }}
          >
            <Image
              src="/mtg-back-hq.webp"
              alt="Card Back"
              fill
              sizes="180px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          </m.div>
        );
      })}
    </div>
  );
};

export function SellHero({ siteName }: SellHeroProps) {
  return (
    <section className="relative pt-24 pb-32 px-6 lg:px-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 size-[50%] bg-teal/10 blur-[150px] rounded-full opacity-40 dark:opacity-20" />
        <div className="absolute bottom-0 right-1/4 size-[50%] bg-gold/10 blur-[150px] rounded-full opacity-40 dark:opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          <m.div
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="/cat.png"
                alt="Hydra Collectables"
                width={56}
                height={56}
                className="object-contain drop-shadow-lg"
              />
              <span className="text-[10px] font-black tracking-widest uppercase text-teal border border-teal/20 px-3 py-1 rounded-full bg-teal/5">
                Vende tus piezas
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tighter mb-8 leading-[0.9] uppercase overflow-visible">
              Vende tus <span className="text-gold">Cartas</span> con <br />
              <span className="text-teal">{siteName}</span>
            </h1>

            <p className="text-xl sm:text-2xl text-vault-text-muted mb-12 max-w-xl leading-relaxed font-black">
              Comisión fija del {SELL_COMMISSION_PERCENT}%. ({SELL_CATEGORY_LIMIT}).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <FlowButton size="lg" className="px-12 h-16 text-lg font-black" showArrows>
                CONTACTAR AHORA
              </FlowButton>
              <div className="text-sm font-black text-gold tracking-widest uppercase flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-gold animate-pulse shadow-[0_0_10px_rgba(var(--color-gold),0.5)]" />
                {SELL_COMMISSION_PERCENT}% Comisión sobre venta
              </div>
            </div>
          </m.div>

          <div className="flex-1 w-full max-w-[600px]">
            <CardFan />
          </div>
        </div>
      </div>
    </section>
  );
}
