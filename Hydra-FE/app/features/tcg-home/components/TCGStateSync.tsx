'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setSelectedTcg } from '@/lib/store/slices/gameSlice';
import { useActiveCategories } from '@/features/products/contexts/ActiveCategoriesContext';
import { type Tcg } from '@/lib/types/tcg';

export function TCGStateSync({ tcg, hasSingles }: { tcg: Tcg; hasSingles?: boolean }) {
  const dispatch = useAppDispatch();
  const selectedTcg = useAppSelector((state) => state.game.selectedTcg);
  const { setActiveCategories } = useActiveCategories();

  useEffect(() => {
    if (!tcg) return;

    if (selectedTcg?.id !== tcg.id) {
      dispatch(setSelectedTcg(tcg));
    }

    const tcgName = (tcg.display_name || tcg.name || '').toLowerCase();
    setActiveCategories({
      hasSingles: hasSingles,
      hasBundles: true,
      hasPreconDecks: true,
      hasMicas: true,
      hasCommander: tcgName.includes('magic'),
    });
  }, [tcg, selectedTcg?.id, dispatch, setActiveCategories, hasSingles]);

  return null;
}
