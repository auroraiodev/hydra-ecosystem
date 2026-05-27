import type { Product, AlternativeVersion } from '@/features/products/types';
import { getProductCanonicalPath } from '@/lib/utils/slug';
import { mapConditionToSchema, getPriceValidUntil } from './product';

function buildVariantOffer(
  price: number,
  stock: number,
  condition: string | undefined,
  variantUrl: string
) {
  return {
    '@type': 'Offer',
    price,
    priceCurrency: 'MXN',
    availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: variantUrl,
    priceValidUntil: getPriceValidUntil(),
    itemCondition: mapConditionToSchema(condition),
    seller: { '@type': 'Organization', name: 'Hydra Collectables' },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 150, currency: 'MXN' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: { '@type': 'Country', name: 'MX' } },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: { '@type': 'Country', name: 'MX' },
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnPeriod',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  };
}

export function generateProductJsonLd(
  product: Product,
  alternativeVersions: AlternativeVersion[],
  canonicalUrl: string,
  baseUrl: string
) {
  const productName = product?.name || product?.cardName || 'Carta Magic';
  const productDescription = product
    ? `Carta ${productName}${product.expansion ? ` de la edición ${product.expansion}` : ''}. Condición: ${product.conditions?.name || 'M/NM'}, Idioma: ${product.languages?.name || 'Español'}.`
    : 'Compra cartas de Magic: The Gathering en Hydra Collectables.';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      alternativeVersions.length > 0
        ? {
            '@type': 'ProductGroup',
            '@id': `${canonicalUrl}#product-group`,
            name: productName,
            description: productDescription,
            image: product.imageUrl || product.img,
            brand: { '@type': 'Brand', name: 'Magic: The Gathering' },
            category: 'Toys & Games > Games > Card Games',
            variesBy: ['https://schema.org/OfferItemCondition', 'https://schema.org/inLanguage'],
            hasVariant: [
              {
                '@type': 'Product',
                '@id': `${canonicalUrl}#product`,
                name: productName,
                sku: product.id,
                image: product.imageUrl || product.img,
                offers: buildVariantOffer(
                  product.price,
                  product.stock,
                  product.conditions?.name,
                  canonicalUrl
                ),
              },
              ...alternativeVersions.map((alt) => {
                const altName = alt.name || alt.cardName || productName;
                const altUrl = `${baseUrl}${getProductCanonicalPath(alt.id, altName)}`;
                return {
                  '@type': 'Product',
                  '@id': `${altUrl}#product`,
                  name: altName,
                  sku: alt.id,
                  image: alt.imageUrl || undefined,
                  offers: buildVariantOffer(
                    alt.price,
                    alt.stock,
                    alt.condition ?? undefined,
                    altUrl
                  ),
                };
              }),
            ],
          }
        : {
            '@type': 'Product',
            '@id': `${canonicalUrl}#product`,
            name: productName,
            image: product.imageUrl || product.img,
            description: productDescription,
            sku: product.id,
            brand: { '@type': 'Brand', name: 'Magic: The Gathering' },
            category: 'Toys & Games > Games > Card Games',
            offers: buildVariantOffer(
              product.price,
              product.stock,
              product.conditions?.name,
              canonicalUrl
            ),
          },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Singles',
            item: `${baseUrl}/singles`,
          },
          ...(product.expansion
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: product.expansion,
                  item: `${baseUrl}/singles/search?expansion=${encodeURIComponent(product.expansion)}&local=true`,
                },
              ]
            : []),
          {
            '@type': 'ListItem',
            position: product.expansion ? 4 : 3,
            name: productName,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
}
