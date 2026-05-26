'use client';

import { DynamicTcgHomeSections } from './DynamicTcgHomeSections';
import { type TcgHomeSectionsProps } from '../types';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';

export function TcgHomeSections({ tcg }: TcgHomeSectionsProps) {
  if (!tcg) return null;

  return (
    <div className="flex flex-col gap-12 lg:gap-20 py-8 lg:py-12">
      <div className="px-4 lg:px-0">
        <DynamicTcgHomeSections tcgId={tcg.id} tcgSlug={tcgNameToSlug(tcg.name)} />
      </div>
    </div>
  );
}
