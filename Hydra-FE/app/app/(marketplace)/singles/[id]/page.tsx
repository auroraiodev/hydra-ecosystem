import { Metadata, ResolvingMetadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import {
  ProductDetailsLoader,
  ProductDetailsClient,
  fetchProductData,
  getProductMetadata,
} from '@/features/singles-details';
import { getAlternativeVersions } from '@/features/products/utils/api';
import { searchLocal } from '@/features/search-filters/utils/api';
import { generateSlug } from '@/lib/utils/slug';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getFirstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string') return value;
  return undefined;
}

export async function generateMetadata(
  { params, searchParams }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const cardName = getFirstParam(resolvedSearchParams.name);
  const language = getFirstParam(resolvedSearchParams.language);

  const product = await fetchProductData(id, cardName, language);

  return getProductMetadata(product, id, resolvedSearchParams);
}

export default async function ProductDetailsPage({ params, searchParams }: Props) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const cardName = getFirstParam(resolvedSearchParams.name);
  const language = getFirstParam(resolvedSearchParams.language);

  const product = await fetchProductData(id, cardName, language);

  if (!product) {
    return <ProductDetailsClient />;
  }

  // Enforce canonical URL redirect to prevent crawl budget waste and duplicate indexing status.
  // Only redirect on ID mismatch (bare UUID → slug URL), not on query params — permanentRedirect
  // preserves search params in Next.js, which would cause infinite redirect loops.
  const productName = product.name || product.cardName || '';
  const slug = generateSlug(productName);
  const expectedParam = slug ? `${product.id}-${slug}` : product.id.toString();

  if (id !== expectedParam) {
    permanentRedirect(`/singles/${expectedParam}`);
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);

  const [alternativeVersions, relatedProducts] = await Promise.all([
    isUuid && product.id ? getAlternativeVersions(product.id, 4) : Promise.resolve([]),
    product.expansion
      ? searchLocal({ q: product.expansion, limit: 8, paginate: false }).then((res) => {
          const items = res.data || [];
          return items
            .filter((item) => item.id !== product.id)
            .slice(0, 4)
            .map((item) => ({
              ...item,
              imageUrl: item.img || '/placeholder-product.png',
            }));
        })
      : Promise.resolve([]),
  ]);

  return (
    <ProductDetailsLoader
      product={product}
      alternativeVersions={alternativeVersions}
      relatedProducts={relatedProducts}
    />
  );
}
