import { CATEGORY_DISPLAY_MAP } from '../constants';

export const getCategoryDisplay = (cat: string | null) => {
  if (!cat) return '';
  const extendedMap: Record<string, string> = {
    ...CATEGORY_DISPLAY_MAP,
    CONSTRUCTED_DECK: 'Mazos',
    BOOSTER_BOX: 'Cajas de Sobres',
    ACCESORIES: 'Accesorios',
  };
  return extendedMap[cat] || cat;
};
