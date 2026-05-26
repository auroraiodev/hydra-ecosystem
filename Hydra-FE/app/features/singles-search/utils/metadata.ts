import type { Metadata } from 'next';
import { tcgSlugToName } from '@/lib/utils/tcgSlug';

interface SearchMetadataProps {
  query?: string;
  category?: string;
  expansion?: string;
  metadata?: string;
  tcg?: string;
}

export function getSearchMetadata({
  query,
  category,
  expansion,
  metadata,
  tcg,
}: SearchMetadataProps): Metadata {
  const tcgName = tcg ? tcgSlugToName(tcg) : '';

  let title = 'Buscar Cartas Magic | Hydra Collectables';
  let description =
    'Encuentra las cartas de Magic: The Gathering que necesitas. Singles, Sellado y más con envíos a todo México.';

  if (query) {
    title = `Resultados para "${query}" ${tcgName ? `en ${tcgName.toUpperCase()}` : ''} | Hydra Collectables`;
    description = `Resultados de búsqueda para ${query} ${tcgName ? `en ${tcgName}` : ''} en Hydra Collectables. Compra tus cartas al mejor precio.`;
  } else if (expansion) {
    title = `Singles de ${expansion} | Hydra Collectables`;
    description = `Todas las cartas de ${expansion} ${tcgName ? `de ${tcgName}` : 'de Magic: The Gathering'} en un solo lugar. Envíos rápidos a todo México.`;
  } else if (category) {
    title = `${category} ${tcgName ? `de ${tcgName}` : ''} | Hydra Collectables`;
    description = `Explora nuestra colección de ${category} ${tcgName ? `de ${tcgName}` : 'de Magic: The Gathering'}.`;
  } else if (metadata === 'cEDH Staple') {
    title = 'Cartas para cEDH | Hydra Collectables';
    description = 'La mejor selección de cartas staple para cEDH en México.';
  } else if (metadata === 'commander') {
    title = 'Cartas para Commander | Hydra Collectables';
    description = 'La mejor selección de cartas para Commander en México.';
  } else if (tcgName) {
    title = `Singles de ${tcgName.toUpperCase()} | Hydra Collectables`;
  }

  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (category) params.set('category', category);
  if (expansion) params.set('expansion', expansion);
  if (metadata) params.set('metadata', metadata);

  const canonicalQuery = params.toString();
  const baseCanonical = tcg ? `/${tcg}/singles/search` : '/singles/search';
  const canonical = `${baseCanonical}${canonicalQuery ? `?${canonicalQuery}` : ''}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'website' },
  };
}
