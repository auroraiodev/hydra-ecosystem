import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SearchDataLoader, SearchSkeleton, VALID_TCG_SLUGS } from '@/features/singles-search';
import { tcgSlugToName } from '@/lib/utils/tcgSlug';
import { getActiveTCGs } from '@/lib/api';
import type { Tcg } from '@/lib/types/tcg';

type Props = {
  params: Promise<{ tcg: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tcg } = await params;
  const tcgName = tcgSlugToName(tcg);
  return {
    title: `Micas y Accesorios de ${tcgName} | Hydra Collectables`,
    description: `Encuentra micas, fundas y accesorios de ${tcgName} en México.`,
    alternates: { canonical: `/${tcg}/micas/search` },
  };
}

export default async function TcgMicasSearchPage({ params, searchParams }: Props) {
  const [{ tcg }, resolvedParams] = await Promise.all([params, searchParams]);

  if (!(VALID_TCG_SLUGS as readonly string[]).includes(tcg)) notFound();

  let resolvedTcgId = typeof resolvedParams.tcgId === 'string' ? resolvedParams.tcgId : undefined;

  if (!resolvedTcgId && tcg) {
    try {
      const tcgName = tcgSlugToName(tcg);
      const activeTcgs = await getActiveTCGs();
      const targetTcg = activeTcgs.find(
        (t: Tcg) =>
          t.name.toLowerCase() === tcgName.toLowerCase() ||
          (t.display_name && t.display_name.toLowerCase() === tcgName.toLowerCase())
      );
      if (targetTcg) {
        resolvedTcgId = targetTcg.id;
      }
    } catch (err) {
      console.error('[MicasSearch] Error resolving TCG ID:', err);
    }
  }

  const page = parseInt(typeof resolvedParams.page === 'string' ? resolvedParams.page : '1', 10);

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchDataLoader category="MICAS" tcgId={resolvedTcgId} isLocal={true} page={page} />
    </Suspense>
  );
}
