import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getApprovedReviews } from '@/lib/api/reviews';
import { searchLocal } from '@/lib/api';
import { searchResultsToCardData } from '@/lib/utils/transformers';
import { tcgSlugToName, tcgNameToSlug } from '@/lib/utils/tcgSlug';
import { getActiveTCGs } from '@/lib/api';
import type { Tcg } from '@/lib/types/tcg';
import type { SearchResult } from '@/lib/types';
import { TCGHomeView, TCGStateSync } from '@/features/tcg-home';

import { VALID_TCG_SLUGS } from '@/features/singles-search/constants';

type Props = {
  params: Promise<{ tcg: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tcg } = await params;
  const tcgName = tcgSlugToName(tcg);
  const title = `Tienda #1 de ${tcgName.toUpperCase()} Mexico | Compra Cartas ${tcgName.toUpperCase()}`;

  const canonicalSlug = tcgNameToSlug(tcgName);
  return {
    title,
    description: `La mejor tienda de ${tcgName} en Mexico. Encuentra singles, micas, bundles y más.`,
    alternates: { canonical: `/${canonicalSlug}` },
  };
}

export const revalidate = 1200;

export default async function TcgHomePage({ params }: Props) {
  const { tcg } = await params;
  if (!(VALID_TCG_SLUGS as readonly string[]).includes(tcg.toLowerCase())) {
    notFound();
  }

  const tcgName = tcgSlugToName(tcg);
  const activeTcgs = await getActiveTCGs();
  const targetTcg = activeTcgs.find(
    (t: Tcg) =>
      tcgNameToSlug(t.name) === tcg.toLowerCase() ||
      tcgNameToSlug(t.display_name ?? '') === tcg.toLowerCase() ||
      t.name.toLowerCase() === tcgName.toLowerCase() ||
      (t.display_name && t.display_name.toLowerCase() === tcgName.toLowerCase())
  );

  if (!targetTcg) {
    notFound();
  }

  const reviewsPromise = getApprovedReviews();
  const latestResponsePromise = searchLocal(
    { tcgId: targetTcg.id, limit: 12, paginate: false },
    { revalidate: 1200 }
  );

  const [reviews, latestResponse] = await Promise.all([
    reviewsPromise.catch(() => []),
    latestResponsePromise.catch(() => ({ success: false, data: [] })),
  ]);

  const latestCards = latestResponse.success
    ? searchResultsToCardData(
        (latestResponse.data || [])
          .filter((i: SearchResult) => !i.isLocalInventory || i.stock > 0)
          .slice(0, 12)
      )
    : [];

  return (
    <>
      <TCGStateSync tcg={targetTcg} hasSingles={latestCards.length > 0} />
      <TCGHomeView selectedTcg={targetTcg} activeTcgs={activeTcgs} reviews={reviews} />
    </>
  );
}
