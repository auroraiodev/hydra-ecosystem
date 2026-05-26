import { Suspense } from 'react';
import { generateProductJsonLd } from '../utils/jsonld';
import { getProductCanonicalPath } from '@/lib/utils/slug';
import { JsonLd } from '@/features/shared/components/JsonLd';
import { ProductDetailsClient } from './ProductDetailsClient';
import type { Product, AlternativeVersion } from '@/lib/api';
import type { AltItem } from '@/features/products/hooks/useProductDetails';

interface ProductDetailsLoaderProps {
  product: Product;
  alternativeVersions: AlternativeVersion[];
  relatedProducts: AltItem[];
}

export function ProductDetailsLoader({
  product,
  alternativeVersions,
  relatedProducts,
}: ProductDetailsLoaderProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hydracollect.com';
  const productName = product.name || product.cardName || 'Carta Magic';
  const canonicalUrl = `${baseUrl}${getProductCanonicalPath(product.id, productName)}`;

  const jsonLd = generateProductJsonLd(product, alternativeVersions, canonicalUrl, baseUrl);

  return (
    <>
      <JsonLd id="product-details-schema" data={jsonLd} />
      <Suspense fallback={null}>
        <ProductDetailsClient
          initialProduct={product}
          initialAlternativeVersions={alternativeVersions as AltItem[]}
          initialRelatedProducts={relatedProducts}
        />
      </Suspense>
    </>
  );
}
