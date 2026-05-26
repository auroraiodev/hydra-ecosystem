'use client';

import { LoadingOverlay } from './LoadingOverlay';
import { useSearchLoading } from '@/features/search-filters/contexts/SearchLoadingContext';

export function SearchLoadingOverlay() {
  const { isLoading } = useSearchLoading();

  if (!isLoading) return null;

  return <LoadingOverlay label="Buscando..." />;
}
