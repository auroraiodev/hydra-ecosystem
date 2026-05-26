import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ProductDetailsLoader,
  fetchProductData,
  getProductMetadata,
} from '@/features/singles-details';
import { getAlternativeVersions } from '@/features/products/utils/api';
import { searchLocal } from '@/features/search-filters/utils/api';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const cardName =
    typeof resolvedSearchParams.name === 'string' ? resolvedSearchParams.name : undefined;
  const language =
    typeof resolvedSearchParams.language === 'string' ? resolvedSearchParams.language : undefined;

  const product = await fetchProductData(id, cardName, language);

  if (!product) {
    notFound();
  }

  return getProductMetadata(product, id, resolvedSearchParams);
}

export default async function ProductDetailsPage({ params, searchParams }: Props) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const cardName =
    typeof resolvedSearchParams.name === 'string' ? resolvedSearchParams.name : undefined;
  const language =
    typeof resolvedSearchParams.language === 'string' ? resolvedSearchParams.language : undefined;

  const product = await fetchProductData(id, cardName, language);

  if (!product) {
    notFound();
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
