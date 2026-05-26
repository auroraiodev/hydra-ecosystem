export interface ActiveCategoriesState {
  hasSingles: boolean | undefined;
  hasBundles: boolean | undefined;
  hasPreconDecks: boolean | undefined;
  hasMicas: boolean | undefined;
  hasCommander: boolean | undefined;
}

export interface ActiveCategoriesContextType extends ActiveCategoriesState {
  setActiveCategories: (state: Partial<ActiveCategoriesState>) => void;
}
