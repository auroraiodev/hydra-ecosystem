'use client';

import { m } from 'framer-motion';
import { SELL_BENEFITS } from '../constants';

export function SellBenefits() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-4">
          {SELL_BENEFITS.map((benefit) => (
            <m.div
              key={benefit.title}
              className="p-10 rounded-3xl vault-glass-card hover:shadow-2xl transition-all"
            >
              <div className="size-14 rounded-xl bg-gold/10 flex items-center justify-center mb-8 border border-gold/20">
                <benefit.icon className="size-7 text-gold" />
              </div>
              <h3 className="font-semibold text-2xl mb-4 group-hover:text-teal transition-colors">
                {benefit.title}
              </h3>
              <p className="text-vault-text-muted leading-relaxed font-medium text-lg">
                {benefit.description}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
