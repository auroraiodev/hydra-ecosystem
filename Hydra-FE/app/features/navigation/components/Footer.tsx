'use client';

import { usePublicSettings } from '@/features/shared';
import { FooterBrand } from './FooterBrand';
import { FooterColumn } from './FooterColumn';
import {
  FOOTER_SHOP_LINKS,
  FOOTER_CATEGORY_LINKS,
  FOOTER_SUPPORT_LINKS,
  FOOTER_LEGAL_LINKS,
} from '../constants';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = usePublicSettings();
  const siteName = settings.site_name || 'Hydra Collectables';

  return (
    <footer className="bg-vault-surface-low border-t border-white/5 pt-16 pb-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          <FooterBrand siteName={siteName} siteLogo={settings.site_logo} />
          <FooterColumn title="Comprar" links={FOOTER_SHOP_LINKS} />
          <FooterColumn title="Categorías" links={FOOTER_CATEGORY_LINKS} />
          <FooterColumn title="Soporte" links={FOOTER_SUPPORT_LINKS} />
          <FooterColumn title="Legal" links={FOOTER_LEGAL_LINKS} />
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-vault-text-muted">
            &copy; {currentYear} {siteName}
          </p>
          <p className="text-xs text-vault-text-muted">Hecho con dedicación para coleccionistas</p>
        </div>
      </div>
    </footer>
  );
}
