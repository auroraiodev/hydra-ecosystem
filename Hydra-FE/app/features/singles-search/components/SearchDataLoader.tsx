import { searchLocal, searchHybrid } from '@/lib/api';
import { SearchClient } from './SearchClient';
import type { HybridSearchResult, SearchDataLoaderProps } from '../types';
import type { SearchPagination } from '@/lib/types';

export async function SearchDataLoader({
  query,
  category,
  expansion,
  metadata,
  tcgId,
  tcgSlug,
  isLocal,
  page,
}: SearchDataLoaderProps) {
  let initialResults: HybridSearchResult[] = [];
  let initialPagination: SearchPagination | null = null;

  // Hybrid search only for MTG (or global searches with no TCG context)
  const isMagic = !tcgSlug || tcgSlug === 'mtg';

  const shouldFetch = isLocal || category || expansion || (metadata && !query) || !isLocal;

  if (shouldFetch) {
    try {
      let response;
      if (!isLocal && query && isMagic) {
        response = await searchHybrid(query, { page, limit: 12 }, { tcgId }, { revalidate: 0 });
      } else {
        response = await searchLocal(
          { q: query, category, expansion, metadata, tcgId, page, limit: 12, paginate: true },
          { revalidate: 0 }
        );
      }
      if (response.success) {
        initialResults = response.data.map((item) => ({
          ...item,
          tags: Array.isArray(item.tags)
            ? item.tags.map((t) => (typeof t === 'string' ? t : t.name))
            : [],
        })) as HybridSearchResult[];
        initialPagination = response.pagination ?? null;
      }
    } catch (error) {
      console.error('Error in SearchDataLoader:', error);
    }
  }

  return (
    <SearchClient
      category={category}
      tcgId={tcgId}
      tcgSlug={tcgSlug}
      initialResults={initialResults}
      initialPagination={initialPagination}
    />
  );
}
