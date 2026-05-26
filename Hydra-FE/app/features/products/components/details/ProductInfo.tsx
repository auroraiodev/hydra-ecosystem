import { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Share2, Copy, Check, X, ShieldCheck, Truck, Lock } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { useCart } from '@/features/cart';

import { getConditionDisplay } from '@/features/products/utils/CardUtils';
import { normalizePrice, resolveLanguageName } from '@/lib/utils/transformers';
import type { ProductInfoProps } from '../../types';

function ShareMenu({
  show,
  buildShareUrl,
  productName,
  onClose,
}: {
  show: boolean;
  buildShareUrl: () => string;
  productName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = buildShareUrl();

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [shareUrl]);

  if (!show) return null;

  return (
    <div className="absolute right-0 top-full mt-1 vault-glass-card rounded-xl shadow-xl z-50 py-1.5 min-w-[210px] border border-surface-border">
      <div className="flex items-center justify-between px-4 py-2 mb-1">
        <span className="text-xs font-semibold text-vault-text-muted uppercase tracking-wider">
          Compartir
        </span>
        <FlowButton
          variant="ghost"
          size="icon"
          simple
          onClick={onClose}
          className="text-vault-text-muted hover:text-white size-auto p-1"
        >
          <X className="size-3.5" />
        </FlowButton>
      </div>
      <FlowButton
        variant="ghost"
        simple
        onClick={handleCopyLink}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-surface-high transition-colors h-auto rounded-none justify-start"
      >
        {copied ? (
          <Check className="size-4 text-teal" />
        ) : (
          <Copy className="size-4 text-vault-text-muted" />
        )}
        {copied ? 'Enlace copiado' : 'Copiar enlace'}
      </FlowButton>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${productName} — ${shareUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-surface-high transition-colors"
        onClick={onClose}
      >
        <svg className="size-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </a>
      <a
        href={`https://x.com/intent/post?text=${encodeURIComponent(productName)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-surface-high transition-colors"
        onClick={onClose}
      >
        <svg className="size-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X (Twitter)
      </a>
    </div>
  );
}

function TrustGuarantees() {
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-teal/10">
            <ShieldCheck className="size-5 text-teal" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-tight">Autenticidad</p>
            <p className="text-[10px] text-vault-text-muted">100% Verificada</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-teal/10">
            <Truck className="size-5 text-teal" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-tight">Envío Seguro</p>
            <p className="text-[10px] text-vault-text-muted">Protección TCG</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-teal/10">
            <Lock className="size-5 text-teal" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-tight">Pago Seguro</p>
            <p className="text-[10px] text-vault-text-muted">SSL Encriptado</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductInfo({ product, buildShareUrl }: ProductInfoProps) {
  const { addToCart } = useCart();

  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node))
        setShowShareMenu(false);
    };
    if (showShareMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  const handleShare = useCallback(async () => {
    const url = buildShareUrl();
    const title = product?.name || product?.cardName || 'Producto';
    const text = `${title} — Hydra Collect`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    setShowShareMenu((v) => !v);
  }, [product, buildShareUrl]);

  const handleAddToCart = async () => {
    if (!product) return;
    const isBundleProduct =
      product.name?.toLowerCase().includes('bundle') ||
      product.metadata?.includes('Bundle') ||
      ['PRECON_DECK', 'CONSTRUCTED_DECK', 'BUNDLE', 'BOOSTER_BOX', 'SEALED'].includes(
        product.categories?.name || ''
      ) ||
      false;
    const cardData = {
      id: product.id,
      title: product.name || product.cardName || '',
      cardName: product.cardName || product.name || '',
      price: normalizePrice(displayPrice) || '0',
      imageUrl: product.imageUrl || product.img || '',
      stock: product.stock,
      expansion: product.expansion,
      variant: product.variant,
      condition: product.conditions?.display_name || product.conditions?.name,
      language: resolveLanguageName(product.languages?.name || product.languages?.display_name) || 'Inglés',
      immediateDelivery: product.isLocalInventory || isBundleProduct,
      isLocalInventory: product.isLocalInventory || isBundleProduct,
      foil: product.foil,
      surgeFoil: product.surgeFoil,
      metadata: product.metadata,
      importationId: product.importationId,
      isBundle: isBundleProduct,
      category: product.category || product.categories?.name || 'SINGLES',
      tcg: product.tcg || 'MAGIC',
      tcgId: product.tcgId || 'bd789d3f-5569-4971-890e-e261e145e42c',
    };
    try {
      await addToCart(cardData, 1);
    } catch {}
  };

  const isBundleProduct =
    product.name?.toLowerCase().includes('bundle') ||
    product.cardName?.toLowerCase().includes('bundle') ||
    product.metadata?.includes('Bundle') ||
    ['PRECON_DECK', 'CONSTRUCTED_DECK', 'BUNDLE', 'BOOSTER_BOX', 'SEALED'].includes(
      product.categories?.name || ''
    ) ||
    false;
  const hasPersonalMetadata =
    product.metadata?.includes('Personal') ||
    product.tags?.some((t: { name: string }) => t.name === 'Personal' || t.name === 'personal') ||
    false;
  const isImportationImport = !!product.importationId && !product.isLocalInventory;
  const isInDb = !!product.isLocalInventory;
  const showExpressBadge = !!hasPersonalMetadata;
  const showImmediateBadge = !hasPersonalMetadata && (isInDb || isBundleProduct);
  const showImportBadge =
    !hasPersonalMetadata && !isInDb && !isBundleProduct && isImportationImport;
  const selectedLanguage =
    resolveLanguageName(product?.languages?.display_name || product?.languages?.name) || 'Inglés';
  const selectedCondition = getConditionDisplay(
    product?.conditions?.display_name || product?.conditions?.name || 'Near Mint'
  );
  const rawPrice =
    Number(product.price) || product.price_mxn_local || product.price_mxn_importation || 0;
  const displayPrice = rawPrice > 0 ? rawPrice.toFixed(2) : null;

  return (
    <div className="p-6 lg:p-10 flex flex-col">
      <div className="flex-grow">
        <div className="flex flex-wrap gap-2 mb-4">
          {showExpressBadge ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
              Importación express
            </span>
          ) : showImmediateBadge ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal/10 text-teal text-xs font-semibold rounded-full border border-teal/20">
              Entrega Inmediata
            </span>
          ) : showImportBadge ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
              Importación
            </span>
          ) : null}
          {product.surgeFoil ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-full">
              <span className="size-1.5 rounded-full bg-white/60 animate-pulse"></span>Surge Foil
            </span>
          ) : (
            product.foil && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/10">
                <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse"></span>Foil
              </span>
            )
          )}
        </div>

        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl lg:text-3xl font-semibold text-white leading-tight">
            {product.name || product.cardName}
          </h1>
          <div className="relative flex-shrink-0 mt-1" ref={shareMenuRef}>
            <FlowButton
              variant="ghost"
              size="icon"
              simple
              onClick={handleShare}
              className="p-2 text-vault-text-muted transition-colors border-0"
              title="Compartir producto"
              aria-label="Compartir"
            >
              <Share2 className="size-5" />
            </FlowButton>
            <ShareMenu
              show={showShareMenu}
              buildShareUrl={buildShareUrl}
              productName={product.name || product.cardName || ''}
              onClose={() => setShowShareMenu(false)}
            />
          </div>
        </div>

        <p className="text-vault-text-muted text-base mb-6">
          {product.expansion} {product.variant ? `· ${product.variant}` : ''}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="vault-glass-card p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-vault-text-muted uppercase font-bold tracking-widest block mb-1">
              Condición
            </span>
            <p className="font-bold text-white text-sm lowercase first-letter:uppercase">
              {selectedCondition}
            </p>
          </div>
          <div className="vault-glass-card p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-vault-text-muted uppercase font-bold tracking-widest block mb-1">
              Idioma
            </span>
            <p className="font-bold text-white text-sm">{selectedLanguage}</p>
          </div>
        </div>

        {product.description && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <h2 className="text-[10px] text-vault-text-muted uppercase font-semibold tracking-widest mb-2">
              Detalles del Producto
            </h2>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        <div className="flex items-baseline gap-2 mb-2">
          {displayPrice ? (
            <>
              <span className="text-5xl font-bold text-teal drop-shadow-[0_0_15px_rgba(var(--glow-primary-rgb)/0.3)]">
                ${displayPrice}
              </span>
              <span className="text-vault-text-muted font-bold text-sm tracking-widest">MXN</span>
            </>
          ) : (
            <span className="text-4xl font-bold text-vault-text-muted/30">---</span>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-vault-text-muted">Disponibilidad</span>
          {product.stock > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-teal text-sm font-semibold">
              <span className="size-2 rounded-full bg-teal shadow-[0_0_8px_rgba(var(--glow-primary-rgb)/0.8)]"></span>
              {product.stock} en stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-red-400 text-sm font-semibold">
              <span className="size-2 rounded-full bg-red-500"></span>Agotado
            </span>
          )}
        </div>

        <FlowButton
          className="w-full justify-center py-6 text-lg shadow-[0_0_20px_rgba(var(--glow-primary-rgb)/0.2)]"
          size="lg"
          variant="vault"
          disabled={product.stock <= 0}
          onClick={handleAddToCart}
        >
          <span className="relative z-10 flex items-center justify-center">
            {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
            <ShoppingCart className="ml-2 size-5 relative z-10" />
          </span>
        </FlowButton>

        <TrustGuarantees />
      </div>
    </div>
  );
}
