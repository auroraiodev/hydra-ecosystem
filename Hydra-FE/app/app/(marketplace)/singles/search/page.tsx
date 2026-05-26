import { Suspense } from 'react';
import { Metadata } from 'next';
import { SearchDataLoader, SearchSkeleton, getSearchMetadata } from '@/features/singles-search';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolved = await searchParams;

  return getSearchMetadata({
    query: typeof resolved.query === 'string' ? resolved.query : undefined,
    category: typeof resolved.category === 'string' ? resolved.category : undefined,
    expansion: typeof resolved.expansion === 'string' ? resolved.expansion : undefined,
    metadata: typeof resolved.metadata === 'string' ? resolved.metadata : undefined,
  });
}

export default async function SinglesSearchPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : undefined;
  const category =
    typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const expansion =
    typeof resolvedParams.expansion === 'string' ? resolvedParams.expansion : undefined;
  const metadata =
    typeof resolvedParams.metadata === 'string' ? resolvedParams.metadata : undefined;
  const isLocal = resolvedParams.local === 'true';
  const tcgId = typeof resolvedParams.tcgId === 'string' ? resolvedParams.tcgId : undefined;
  const page = parseInt(typeof resolvedParams.page === 'string' ? resolvedParams.page : '1', 10);

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchDataLoader
        query={query}
        category={category}
        expansion={expansion}
        metadata={metadata}
        tcgId={tcgId}
        isLocal={isLocal}
        page={page}
      />
    </Suspense>
  );
}
