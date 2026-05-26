import { searchLocal } from '@/lib/api';
import { SinglesLandingClient } from './SinglesLandingClient';
import { SearchResult } from '@/lib/types';

export async function SinglesLandingPage() {
  const revalidate = 1200;

  let initialData = {
    commander: [] as SearchResult[],
    cedhStaple: [] as SearchResult[],
  };

  try {
    const [commander, cedhStaple] = await Promise.all([
      searchLocal({ limit: 20, metadata: 'commander' }, { revalidate }),
      searchLocal({ limit: 20, metadata: 'cEDH Staple' }, { revalidate }),
    ]);

    const filterStock = (data: SearchResult[]) =>
      (data || []).filter((item) => !item.isLocalInventory || item.stock > 0);

    initialData = {
      commander: filterStock(commander.data),
      cedhStaple: filterStock(cedhStaple.data),
    };
  } catch (error) {
    console.error('Error fetching singles landing data:', error);
  }

  return <SinglesLandingClient initialData={initialData} />;
}
