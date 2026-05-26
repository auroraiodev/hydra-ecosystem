'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { SELL_FAQS } from '../constants';

export function SellFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-semibold mb-16 text-center uppercase tracking-tight">
          Preguntas frecuentes
        </h2>
        <div className="gap-y-4">
          {SELL_FAQS.map((faq, idx) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-white/10 overflow-hidden bg-vault-surface/50 shadow-sm"
            >
              <FlowButton
                variant="ghost"
                simple
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-10 py-8 flex items-center justify-between text-left group h-auto border-0 focus:ring-0"
              >
                <span className="font-black text-xl group-hover:text-teal transition-colors">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`size-6 transition-transform duration-500 ${openFaq === idx ? 'rotate-180 text-teal' : 'text-vault-text-muted'}`}
                />
              </FlowButton>
              <AnimatePresence>
                {openFaq === idx && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-10 pb-10 text-vault-text-muted text-lg font-medium leading-relaxed"
                  >
                    {faq.answer}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
