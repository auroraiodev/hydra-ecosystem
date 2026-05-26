import { Suspense } from 'react';
import { Metadata } from 'next';
import { SearchClient, type HybridSearchResult } from '@/features/singles-search';
import { CardSkeleton } from '@/features/shared/ui';
import type { SearchPagination } from '@/lib/types';
import { searchLocal } from '@/lib/api';

type Props = {
  params: Promise<{ expansion: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { expansion: rawExpansion } = await params;
  const expansion = decodeURIComponent(rawExpansion);

  const title = `Singles de ${expansion} | Hydra Collectables`;
  const description = `Compra todas las cartas de la edición ${expansion} de Magic: The Gathering. Disponibles ahora con envíos a todo México.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/singles/set/${rawExpansion}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function SinglesSetPage({ params }: Props) {
  const { expansion } = await params;
  const decodedExpansion = decodeURIComponent(expansion);

  // Fetch first page on the server for SEO (Antigravity Kit Optimization)
  let initialResults: HybridSearchResult[] = [];
  let initialPagination: SearchPagination | null = null;

  try {
    const response = await searchLocal(
      { limit: 12, expansion: decodedExpansion, paginate: true },
      { revalidate: 3600 }
    );
    if (response.success) {
      initialResults = response.data.map((item) => ({
        ...item,
        tags: Array.isArray(item.tags)
          ? item.tags.map((t) => (typeof t === 'string' ? t : t.name))
          : [],
      })) as HybridSearchResult[];
      initialPagination = response.pagination ?? null;
    }
  } catch (err) {
    console.error(`Error fetching initial data for expansion ${decodedExpansion}:`, err);
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <CardSkeleton count={12} variant="singles" />
          </div>
        </div>
      }
    >
      <SearchClient
        forcedExpansion={decodedExpansion}
        initialResults={initialResults}
        initialPagination={initialPagination}
      />
    </Suspense>
  );
}
