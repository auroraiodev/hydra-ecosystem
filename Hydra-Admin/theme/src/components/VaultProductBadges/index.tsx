import * as React from 'react';
import { ConditionChip } from '../ConditionChip';
import { VaultBadge } from '../VaultBadge';

const LANGUAGE_MAP: Record<string, string> = {
  EN: 'English',
  ES: 'Español',
  JP: 'Japanese',
  FR: 'French',
  DE: 'German',
  IT: 'Italian',
  PT: 'Portuguese',
  KO: 'Korean',
  RU: 'Russian',
  ZH: 'Chinese',
  TW: 'Traditional Chinese',
};

function resolveLanguageName(lang: string): string {
  return LANGUAGE_MAP[lang.toUpperCase()] ?? lang;
}

export interface VaultProductBadgesProduct {
  title?: string | null;
  cardName?: string | null;
  condition?: string | null;
  foil?: boolean | null;
  surgeFoil?: boolean | null;
  language?: string | null;
  isLocalInventory?: boolean | null;
  immediateDelivery?: boolean | null;
  isImportation?: boolean | null;
  importationId?: string | null;
  metadata?: string[] | null;
  isBundle?: boolean | null;
  stock?: number | null;
  isSerialized?: boolean | null;
  isShowcase?: boolean | null;
  isAlternateFrame?: boolean | null;
}

export interface VaultProductBadgesProps {
  product: VaultProductBadgesProduct;
  className?: string;
}

export function VaultProductBadges({ product, className }: VaultProductBadgesProps) {
  const isBundle =
    product.isBundle ||
    (product.title &&
      (product.title.toLowerCase().includes('bundle') || product.title.includes('Bundle'))) ||
    product.metadata?.includes('Bundle');

  const isInDb = !!(product.immediateDelivery || product.isLocalInventory);
  const isPersonal = product.metadata?.some((m) => m.toLowerCase() === 'personal');
  const isImport = !!(product.isImportation || product.importationId);

  const showExpressBadge  = isPersonal;
  const showImmediateBadge = !isPersonal && isInDb;
  const showImportBadge    = !isPersonal && !isInDb && isImport;

  const outOfStock =
    product.stock !== undefined && product.stock !== null && product.stock <= 0;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
      {(product.condition || isImport) && (
        <ConditionChip condition={product.condition || 'Near Mint'} />
      )}

      {product.surgeFoil === true ? (
        <VaultBadge variant="teal">Surge Foil</VaultBadge>
      ) : (
        product.foil === true && <VaultBadge variant="gold">Foil</VaultBadge>
      )}

      {product.language && (
        <VaultBadge capitalize>{resolveLanguageName(product.language)}</VaultBadge>
      )}

      {isBundle && isInDb && <VaultBadge variant="teal">Stock</VaultBadge>}

      {showImmediateBadge && !isBundle && (
        <VaultBadge variant="teal">Entrega Inmediata</VaultBadge>
      )}

      {showExpressBadge && (
        <VaultBadge variant="orange">Importación Express</VaultBadge>
      )}

      {showImportBadge && (
        <VaultBadge variant="orange">Importación</VaultBadge>
      )}

      {product.isSerialized     && <VaultBadge variant="purple"># Serializada</VaultBadge>}
      {product.isShowcase       && <VaultBadge variant="blue">Showcase</VaultBadge>}
      {product.isAlternateFrame && <VaultBadge variant="orange">Alt Art</VaultBadge>}

      {outOfStock && <VaultBadge variant="red">Sin Stock</VaultBadge>}
    </div>
  );
}
