'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { type Product } from '@/features/products';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { VaultProductCard } from '@/features/products/components';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { FadeUp } from '@/features/shared/components/Animations';

import { useProductDetails } from '@/features/products/hooks';
import type { AltItem } from '@/features/products/hooks/useProductDetails';
import { normalizePrice, resolveLanguageName } from '@/lib/utils/transformers';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { ProductGallery, ProductInfo } from '@/features/products/components';

const EMPTY_ALT_ITEMS: AltItem[] = [];

export interface ProductDetailsClientProps {
  initialProduct?: Product | null;
  initialAlternativeVersions?: AltItem[];
  initialRelatedProducts?: AltItem[];
}

function ProductDetailsContent({
  initialProduct,
  initialAlternativeVersions = EMPTY_ALT_ITEMS,
  initialRelatedProducts = EMPTY_ALT_ITEMS,
}: ProductDetailsClientProps) {
  const { back } = useRouter();
  const { product, loading, error, alternativeVersions, relatedProducts, buildShareUrl } =
    useProductDetails(
      useSearchParams(),
      initialProduct,
      initialAlternativeVersions,
      initialRelatedProducts
    );

  // Clean enrichment query params from UUID product URLs to prevent duplicate crawling
  useEffect(() => {
    if (!product || typeof window === 'undefined') return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      product.id || ''
    );
    if (isUuid && window.location.search) {
      const enrichmentParams = [
        'importationId',
        'name',
        'price',
        'img',
        'stock',
        'isLocalInventory',
        'expansion',
        'variant',
        'condition',
        'language',
      ];
      const currentParams = new URLSearchParams(window.location.search);
      const hasEnrichment = enrichmentParams.some((p) => currentParams.has(p));
      if (hasEnrichment) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-vault-bg text-white antialiased relative overflow-hidden font-display pb-24 lg:pb-0 -mt-14 pt-14">
        <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
        <main className="flex-grow container mx-auto px-4 py-8 lg:py-12 relative z-10">
          <button
            type="button"
            className="mb-6 flex items-center text-vault-text-muted font-medium hover:text-teal transition-colors"
            onClick={() => back()}
          >
            <ArrowLeft className="mr-1 size-4" />
            Volver a resultados
          </button>
          <div className="vault-glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
              <div className="bg-white/5 p-8 flex flex-col items-center justify-center relative">
                <Skeleton
                  className="w-full max-w-lg aspect-[3/4] shadow-xl rounded-xl mb-4"
                  vault
                />
              </div>
              <div className="p-6 lg:p-10 flex flex-col">
                <div className="flex-grow gap-y-6">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Skeleton className="h-6 w-24" vault />
                      <Skeleton className="h-6 w-16" vault />
                    </div>
                    <Skeleton className="h-8 lg:h-10 w-3/4 mb-3" vault />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <Skeleton className="h-20 rounded-lg border border-white/5" vault />
                    <Skeleton className="h-20 rounded-lg border border-white/5" vault />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-vault-bg text-white flex flex-col -mt-14 pt-14">
        <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
          <p className="text-red-400 mb-4">{error || 'Producto no encontrado'}</p>
          <FlowButton onClick={() => back()} size="sm" variant="vault" className="gap-2">
            <ArrowLeft className="size-4" />
            Volver
          </FlowButton>
        </main>
      </div>
    );
  }

  const transformToCardData = (item: AltItem) => ({
    id: item.id ?? '',
    title: item.cardName || item.name || '',
    cardName: item.cardName,
    price: normalizePrice(item.price ?? item.finalPrice) || '0',
    imageUrl: item.img || item.imageUrl || '',
    stock: item.stock || 0,
    expansion: item.expansion ?? undefined,
    variant: item.variant ?? undefined,
    condition: item.condition_name || item.condition || item.conditions?.name,
    language:
      item.language_name ||
      item.languages?.display_name ||
      item.languages?.name ||
      resolveLanguageName(item.language),
    isLocalInventory: item.isLocalInventory,
    foil: item.foil,
    surgeFoil: item.surgeFoil,
    href: `/singles/${item.id}`,
  });

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl || product.img || ''];
  const validImages = allImages
    .filter((img: string) => img && img.length > 0)
    .map((img: string) => resolveImageUrl(img));

  return (
    <div className="min-h-screen bg-vault-bg text-white antialiased relative overflow-hidden font-display pb-24 lg:pb-0 -mt-14 pt-14">
      {/* Background glows */}
      <div className="absolute top-0 right-0 size-[900px] bg-teal/5 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[15%] left-0 size-[700px] bg-teal/3 rounded-full blur-[120px] -translate-x-1/3 pointer-events-none z-0" />

      <main className="flex-grow container mx-auto px-4 py-8 lg:py-12 relative z-10">
        <FadeUp>
          <nav className="flex mb-8 items-center text-sm font-medium text-vault-text-muted whitespace-nowrap overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <Link href="/" className="hover:text-teal transition-colors flex items-center shrink-0">
              Inicio
            </Link>
            <span className="mx-2 text-white/20 shrink-0">/</span>
            <Link
              href="/singles"
              className="hover:text-teal transition-colors flex items-center shrink-0"
            >
              Singles
            </Link>
            <span className="mx-2 text-white/20 shrink-0">/</span>
            {product.expansion && (
              <>
                <Link
                  href={`/singles/search?query=${encodeURIComponent(product.expansion)}`}
                  className="hover:text-teal transition-colors shrink-0"
                >
                  {product.expansion}
                </Link>
                <span className="mx-2 text-white/20 shrink-0">/</span>
              </>
            )}
            <span className="text-white truncate shrink min-w-0">
              {product.name || product.cardName || 'Producto'}
            </span>
          </nav>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="vault-glass-card border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
              <ProductGallery
                images={validImages}
                productName={product.name || product.cardName || ''}
                isFoil={!!product.foil}
              />
              <ProductInfo product={product} buildShareUrl={buildShareUrl} />
            </div>
          </div>
        </FadeUp>

        {alternativeVersions.length > 0 && (
          <div className="mt-20">
            <FadeUp>
              <div className="flex items-center gap-4 mb-10 group/section">
                <div className="w-1.5 h-8 bg-teal rounded-full shadow-[0_0_15px_rgba(var(--glow-primary-rgb) / 0.5)]"></div>
                <h2 className="text-xl lg:text-3xl font-semibold text-white tracking-tight uppercase">
                  Otras versiones encontradas
                </h2>
              </div>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {alternativeVersions.map((item, idx) => (
                <FadeUp key={item.id} delay={idx * 0.05}>
                  <VaultProductCard card={transformToCardData(item)} />
                </FadeUp>
              ))}
            </div>
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-24 mb-24">
            <FadeUp>
              <div className="flex items-center gap-4 mb-10 group/section">
                <div className="w-1.5 h-8 bg-teal rounded-full shadow-[0_0_15px_rgba(var(--glow-primary-rgb) / 0.5)]"></div>
                <h2 className="text-xl lg:text-3xl font-semibold text-white tracking-tight uppercase">
                  Más de {product.expansion}
                </h2>
              </div>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item, idx) => (
                <FadeUp key={item.id} delay={idx * 0.05}>
                  <VaultProductCard card={transformToCardData(item)} />
                </FadeUp>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function ProductDetailsClient(props: ProductDetailsClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-vault-bg" />}>
      <ProductDetailsContent {...props} />
    </Suspense>
  );
}
