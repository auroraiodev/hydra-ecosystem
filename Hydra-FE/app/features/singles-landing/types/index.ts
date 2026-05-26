import { SearchResult } from '@/lib/types';

export interface SinglesLandingClientProps {
  initialData: {
    commander: SearchResult[];
    cedhStaple: SearchResult[];
  };
}
