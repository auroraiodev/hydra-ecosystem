import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  SearchDataLoader,
  SearchSkeleton,
  getSearchMetadata,
  VALID_TCG_SLUGS,
} from '@/features/singles-search';
import { getActiveTCGs } from '@/lib/api';
import { tcgSlugToName, tcgNameToSlug } from '@/lib/utils/tcgSlug';
import type { Tcg } from '@/lib/types/tcg';

type Props = {
  params: Promise<{ tcg: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ tcg }, resolved] = await Promise.all([params, searchParams]);

  return getSearchMetadata({
    query: typeof resolved.query === 'string' ? resolved.query : undefined,
    category: typeof resolved.category === 'string' ? resolved.category : undefined,
    expansion: typeof resolved.expansion === 'string' ? resolved.expansion : undefined,
    metadata: typeof resolved.metadata === 'string' ? resolved.metadata : undefined,
    tcg,
  });
}

export default async function TcgSinglesSearchPage({ params, searchParams }: Props) {
  const [{ tcg }, resolvedParams] = await Promise.all([params, searchParams]);

  if (!(VALID_TCG_SLUGS as readonly string[]).includes(tcg)) notFound();

  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : undefined;
  const category =
    typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const expansion =
    typeof resolvedParams.expansion === 'string' ? resolvedParams.expansion : undefined;
  const metadata =
    typeof resolvedParams.metadata === 'string' ? resolvedParams.metadata : undefined;
  const isLocal = resolvedParams.local === 'true';
  const page = parseInt(typeof resolvedParams.page === 'string' ? resolvedParams.page : '1', 10);

  // If tcgId is missing, resolve it from the slug
  let resolvedTcgId = typeof resolvedParams.tcgId === 'string' ? resolvedParams.tcgId : undefined;

  if (!resolvedTcgId && tcg) {
    try {
      const tcgName = tcgSlugToName(tcg);
      const activeTcgs = await getActiveTCGs();

      const targetTcg = activeTcgs.find(
        (t: Tcg) =>
          tcgNameToSlug(t.name) === tcg.toLowerCase() ||
          tcgNameToSlug(t.display_name ?? '') === tcg.toLowerCase() ||
          t.name.toLowerCase() === tcgName.toLowerCase() ||
          (t.display_name && t.display_name.toLowerCase() === tcgName.toLowerCase())
      );

      if (targetTcg) {
        resolvedTcgId = targetTcg.id;
      } else {
        console.warn(`[SearchPage] Could not find active TCG for slug: ${tcg}`);
      }
    } catch (err) {
      console.error('[SearchPage] Error resolving TCG ID:', err);
    }
  }

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchDataLoader
        query={query}
        category={category}
        expansion={expansion}
        metadata={metadata}
        tcgId={resolvedTcgId}
        tcgSlug={tcg}
        isLocal={isLocal}
        page={page}
      />
    </Suspense>
  );
}
