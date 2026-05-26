'use client';

import { usePublicSettings } from '@/features/shared';
import { SellHero, SellProcess, SellBenefits, SellFAQ, SellCTA } from '@/features/sell';

export default function SellClient() {
  const { settings } = usePublicSettings();
  const siteName = settings?.site_name || 'Hydra Collectables';

  return (
    <div className="dark min-h-screen bg-vault-bg text-vault-text pb-32 overflow-x-hidden relative">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[800px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[30%] left-0 size-[600px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      <div className="relative z-10">
        <SellHero settings={settings} siteName={siteName} />
        <SellProcess />
        <SellBenefits />
        <SellFAQ />
        <SellCTA />
      </div>
    </div>
  );
}
