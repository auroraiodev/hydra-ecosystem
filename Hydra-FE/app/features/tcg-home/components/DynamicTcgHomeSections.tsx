'use client';

import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles, ShoppingBag, Layers, Box, Package, Shield, Zap } from 'lucide-react';
import { ProductCarousel } from '@/features/products/components';
import { useDynamicSections } from '../hooks/useDynamicSections';
import { VaultSectionHeader } from './VaultSectionHeader';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  SINGLES: Sparkles,
  Bundle: ShoppingBag,
  BUNDLE: ShoppingBag,
  PRECON_DECK: Layers,
  BOOSTER_BOX: Box,
  BOOSTER: Package,
  CONSTRUCTED_DECK: Layers,
  MICAS: Shield,
};

interface DynamicTcgHomeSectionsProps {
  tcgId: string;
  tcgSlug: string;
}

export function DynamicTcgHomeSections({ tcgId, tcgSlug }: DynamicTcgHomeSectionsProps) {
  const skId = useId();
  const { sections, loading } = useDynamicSections(tcgId, tcgSlug);

  if (!loading && sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-12 lg:gap-20">
      {loading
        ? Array.from({ length: 3 }, (_, i) => `${skId}-sk-${i}`).map((key) => (
            <section key={key} className="lg:mt-6">
              <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-8" />
              <ProductCarousel cards={[]} loading={true} />
            </section>
          ))
        : sections.map((section) => {
            const Icon = CATEGORY_ICONS[section.category] ?? Zap;
            return (
              <section key={section.category} className="lg:mt-6">
                <VaultSectionHeader title={section.title} href={section.href} icon={Icon} />
                <ProductCarousel cards={section.cards} loading={false} />
              </section>
            );
          })}
    </div>
  );
}
