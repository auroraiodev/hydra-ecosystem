import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getActiveTCGs } from '@/lib/api';
import { tcgNameToSlug, tcgSlugToName } from '@/lib/utils/tcgSlug';
import { VALID_TCG_SLUGS, SearchDataLoader, SearchSkeleton } from '@/features/singles-search';
import type { Tcg } from '@/lib/types/tcg';

// Static folders under [tcg] that must NOT be caught by this dynamic route.
// Next.js already prioritises static segments, but listing them here makes the
// intent explicit and lets us bail out cleanly if somehow reached.
const RESERVED_SEGMENTS = new Set(['singles', 'bundles', 'decks', 'micas']);

type Props = {
  params: Promise<{ tcg: string; category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TcgCategoryPage({ params, searchParams }: Props) {
  const [{ tcg, category }, resolvedSearch] = await Promise.all([params, searchParams]);

  if (!(VALID_TCG_SLUGS as readonly string[]).includes(tcg.toLowerCase())) notFound();
  if (RESERVED_SEGMENTS.has(category.toLowerCase())) notFound();

  const activeTcgs = await getActiveTCGs();
  const tcgName = tcgSlugToName(tcg);
  const targetTcg = activeTcgs.find(
    (t: Tcg) =>
      tcgNameToSlug(t.name) === tcg.toLowerCase() ||
      tcgNameToSlug(t.display_name ?? '') === tcg.toLowerCase() ||
      t.name.toLowerCase() === tcgName.toLowerCase() ||
      (t.display_name && t.display_name.toLowerCase() === tcgName.toLowerCase())
  );

  if (!targetTcg) notFound();

  const page = parseInt(typeof resolvedSearch.page === 'string' ? resolvedSearch.page : '1', 10);

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchDataLoader
        category={category}
        tcgId={targetTcg.id}
        tcgSlug={tcg}
        isLocal={true}
        page={page}
      />
    </Suspense>
  );
}
