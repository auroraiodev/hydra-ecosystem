import { Metadata } from 'next';
import type { Product } from '@/lib/api';

const PRICE_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function getProductMetadata(
  product: Product | null,
  id: string,
  searchParams: Record<string, string | string[] | undefined>
): Metadata {
  if (!product) {
    const nameParam = typeof searchParams.name === 'string' ? searchParams.name : null;
    if (nameParam) {
      return {
        title: `${nameParam} | Hydra Collectables`,
        description: `Compra ${nameParam}. Disponible en Hydra Collectables.`,
        openGraph: {
          title: `${nameParam} | Hydra Collectables`,
          description: `Compra ${nameParam} en Hydra Collectables.`,
          images:
            typeof searchParams.img === 'string' ? [{ url: searchParams.img, alt: nameParam }] : [],
        },
      };
    }
    return {
      title: 'Producto no encontrado | Hydra Collectables',
      description: 'El producto que buscas no está disponible.',
      robots: { index: false, follow: true },
    };
  }

  const productName = product.name || product.cardName || 'Carta Magic';
  const price = PRICE_FORMATTER.format(product.price);
  const canonicalPath = `/singles/${id}`;

  const keywords = [
    productName,
    `${productName} MTG`,
    `comprar ${productName}`,
    product.expansion ? `${productName} ${product.expansion}` : null,
    'Magic The Gathering México',
    'singles MTG México',
    'Hydra Collectables',
  ].filter(Boolean) as string[];

  return {
    title: `${productName} | Hydra Collectables`,
    description: `Compra ${productName} por ${price}. ${product.expansion ? `Expansion: ${product.expansion}. ` : ''}Envíos a todo México.`,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${productName} - ${price} | Hydra Collectables`,
      description: `Compra ${productName}. ${product.conditions?.name || ''} - ${product.languages?.name || ''}. Disponible ahora.`,
      images: [
        {
          url: product.imageUrl || product.img || '/opengraph-image',
          width: 400,
          height: 560,
          alt: productName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [product.imageUrl || product.img || '/opengraph-image'],
    },
  };
}
