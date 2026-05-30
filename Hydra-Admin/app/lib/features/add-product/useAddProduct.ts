'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  usersAPI,
  categoriesAPI,
  conditionsAPI,
  raritiesAPI,
  languagesAPI,
  singlesAPI,
  cardSearchAPI,
  tcgsAPI,
  settingsAPI,
} from '@/lib/api';
import type {
  AddProductData,
  AddProductState,
  AddProductActions,
  User,
  Category,
  Condition,
  Language,
  Rarity,
  ImportationCard,
  ImportationSearchFilters,
  Tcg,
} from './types';
import { callCardSelectHandler, hasCardSelectHandler } from './card-select-registry';

type InternalState = Omit<
  AddProductState,
  | 'owners'
  | 'categories'
  | 'tcgs'
  | 'conditions'
  | 'rarities'
  | 'languages'
  | 'importationSearchResults'
  | 'isSearchingImportation'
  | 'isAdmin'
  | 'importationSettings'
>;

export function useAddProduct(): AddProductState & AddProductActions {
  const [state, setState] = useState<InternalState>({
    selectedOwner: null,
    selectedCategory: null,
    selectedTcg: null,
    items: [],
    loading: false,
    error: null,
    currentStep: 1,
    isSubmitting: false,
    validationErrors: {},
    importationFilters: {},
  });

  const [owners, setOwners] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tcgs, setTcgs] = useState<Tcg[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [importationSearchResults, setImportationSearchResults] = useState<ImportationCard[]>([]);
  const [isSearchingImportation, setIsSearchingImportation] = useState(false);
  const [importationFilters, setImportationFilters] = useState<ImportationSearchFilters>({});
  const [importationSettings, setImportationSettings] = useState({ tax: 0.2, profit: 0.2 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadOwners = useCallback(async () => {
    try {
      // Role check via session endpoint instead of localStorage
      const sessionRes = await fetch('/auth-session', { credentials: 'include' });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setIsAdmin(sessionData.user?.role === 'ADMIN');
      }

      // GET /api/users - Get all users (no parameters)
      const response = await usersAPI.list();

      // Handle different response structures
      interface RawUserResponse {
        id?: string;
        _id?: string;
        email: string;
        name?: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        phone?: string;
        roles?: { name?: string } | string;
        role?: { name?: string } | string;
        is_active?: boolean;
      }

      let usersArray: RawUserResponse[] = [];

      if (Array.isArray(response)) {
        usersArray = response as RawUserResponse[];
      } else if (response?.data && Array.isArray(response.data)) {
        usersArray = response.data as RawUserResponse[];
      } else if (response?.success && response.data && Array.isArray(response.data)) {
        usersArray = response.data as RawUserResponse[];
      } else {
        usersArray = [];
      }

      setOwners(
        usersArray.map((u) => ({
          id: u.id || u._id || '',
          email: u.email,
          name:
            u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          phone: u.phone,
          role:
            typeof u.roles === 'object' && u.roles !== null
              ? (u.roles as { name?: string }).name
              : typeof u.role === 'object' && u.role !== null
                ? (u.role as { name?: string }).name
                : (u.role as string | undefined),
          isActive: u.is_active !== false,
        }))
      );
    } catch (error) {
      console.error('Error loading owners:', error);
      toast.error('Error al cargar los propietarios');
      setOwners([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadCategories = useCallback(async (tcgId?: string) => {
    try {
      setIsLoadingData(true);

      // Use getAll (admin endpoint) and filter client-side by TCG.
      // This avoids the marketplace-tuned findActive which filters out categories
      // with zero products — unusable for the admin add-product flow.
      const response = await categoriesAPI.getAll();

      interface RawCategoryResponse {
        id?: string;
        _id?: string;
        name: string;
        display_name?: string;
        displayName?: string;
        description?: string;
        is_active?: boolean;
        form_config?: Record<string, unknown>;
        tcgs?: { id: string }[];
      }

      let all: RawCategoryResponse[] = [];
      if (Array.isArray(response)) {
        all = response as RawCategoryResponse[];
      } else if (response?.data && Array.isArray(response.data)) {
        all = response.data as RawCategoryResponse[];
      } else if (response?.success && response.data && Array.isArray(response.data)) {
        all = response.data as RawCategoryResponse[];
      }

      // Keep only active categories that belong to the selected TCG
      const filtered = all.filter((c) => {
        if (c.is_active === false) return false;
        if (tcgId) return c.tcgs?.some((t) => t.id === tcgId) ?? false;
        return true;
      });

      setCategories(
        filtered.map((c) => ({
          id: (c.id || c._id) as string,
          name: c.name,
          displayName: c.display_name || c.displayName || c.name,
          description: c.description,
          form_config: c.form_config as Record<string, unknown>,
        }))
      );
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Error al cargar las categorías');
      setCategories([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadTcgs = useCallback(async () => {
    try {
      setIsLoadingData(true);
      // Fetch ALL TCGs for administrative use (inventory management)
      const res = await tcgsAPI.list();

      let tcgsData: Tcg[] = [];
      if (Array.isArray(res)) {
        tcgsData = res;
      } else if (res?.data && Array.isArray(res.data)) {
        tcgsData = res.data;
      } else if (res?.success && res.data && Array.isArray(res.data)) {
        tcgsData = res.data;
      }

      setTcgs(tcgsData);
    } catch (error) {
      console.error('Error loading TCGs:', error);
      setTcgs([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadConditions = useCallback(async () => {
    try {
      setIsLoadingData(true);
      let response;
      try {
        response = await conditionsAPI.getActive();
  
      } catch {
        // Fallback to list if active endpoint doesn't exist
        try {
          response = await conditionsAPI.list();

        } catch (listError: unknown) {
          // If both endpoints fail, use default conditions
          void listError;
          const defaultConditions: Condition[] = [
            { id: 'nm', name: 'near-mint', displayName: 'Near Mint' },
            { id: 'lp', name: 'lightly-played', displayName: 'Lightly Played' },
            { id: 'mp', name: 'moderately-played', displayName: 'Moderately Played' },
            { id: 'hp', name: 'heavily-played', displayName: 'Heavily Played' },
            { id: 'dm', name: 'damaged', displayName: 'Damaged' },
          ];
          setConditions(defaultConditions);
          return;
        }
      }



      if (response && (response.success || response.data || Array.isArray(response))) {
        let conds: Array<Record<string, unknown>> = [];

        // Handle different response structures (including double-nested data.data)
        if (Array.isArray(response)) {
          conds = response;
        } else if (response.data) {
          // Check if data.data exists (double nesting - this is the case from the API)
          if (response.data.data && Array.isArray(response.data.data)) {
            conds = response.data.data;
          } else if (response.data.data && !Array.isArray(response.data.data)) {
            conds = [response.data.data];
          } else if (Array.isArray(response.data)) {
            conds = response.data;
          } else {
            conds = [response.data];
          }
        } else if (response.success && response.data) {
          // Handle nested structure
          if (response.data.data && Array.isArray(response.data.data)) {
            conds = response.data.data;
          } else if (Array.isArray(response.data)) {
            conds = response.data;
          } else {
            conds = [response.data];
          }
        }



        // Filter for active conditions if needed (check isActive field)
        const activeConds = conds.filter((c) => {
          const isActive =
            c.isActive !== false &&
            c.isActive !== 'false' &&
            c.is_active !== false &&
            c.is_active !== 'false';

          return isActive;
        });



        const mappedConditions = activeConds.map((c) => ({
          id: String(c.id ?? c._id ?? ''),
          name: String(c.name ?? ''),
          displayName: String(c.displayName ?? c.display_name ?? c.name ?? ''),
        }));


        setConditions(mappedConditions);
      } else {

        // Use default conditions if API doesn't return valid data
        const defaultConditions: Condition[] = [
          { id: 'nm', name: 'near-mint', displayName: 'Near Mint' },
          { id: 'lp', name: 'lightly-played', displayName: 'Lightly Played' },
          { id: 'mp', name: 'moderately-played', displayName: 'Moderately Played' },
          { id: 'hp', name: 'heavily-played', displayName: 'Heavily Played' },
          { id: 'dm', name: 'damaged', displayName: 'Damaged' },
        ];
        setConditions(defaultConditions);
      }
    } catch (error) {
      console.error('Error loading conditions:', error);
      // Use default conditions when endpoint is not available
      if ((error as { status?: number })?.status === 404) {

        const defaultConditions: Condition[] = [
          { id: 'nm', name: 'near-mint', displayName: 'Near Mint' },
          { id: 'lp', name: 'lightly-played', displayName: 'Lightly Played' },
          { id: 'mp', name: 'moderately-played', displayName: 'Moderately Played' },
          { id: 'hp', name: 'heavily-played', displayName: 'Heavily Played' },
          { id: 'dm', name: 'damaged', displayName: 'Damaged' },
        ];
        setConditions(defaultConditions);
      } else {
        toast.error('Error al cargar las condiciones');
        // Still set default conditions even on error
        const defaultConditions: Condition[] = [
          { id: 'nm', name: 'near-mint', displayName: 'Near Mint' },
          { id: 'lp', name: 'lightly-played', displayName: 'Lightly Played' },
          { id: 'mp', name: 'moderately-played', displayName: 'Moderately Played' },
          { id: 'hp', name: 'heavily-played', displayName: 'Heavily Played' },
          { id: 'dm', name: 'damaged', displayName: 'Damaged' },
        ];
        setConditions(defaultConditions);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadRarities = useCallback(async () => {
    try {
      setIsLoadingData(true);
      let response;
      try {
        response = await raritiesAPI.getActive();
      } catch {
        // Fallback to list if active endpoint doesn't exist
        try {
          response = await raritiesAPI.list();
        } catch {
          // If both endpoints fail, set empty array and continue
    
          setRarities([]);
          return;
        }
      }
      if (response.success && response.data) {
        const rars = Array.isArray(response.data) ? response.data : [response.data];
        // Filter for active rarities if needed (check isActive field)
        const activeRars = rars.filter((r: Record<string, unknown>) => r.isActive !== false);
        setRarities(
          activeRars.map((r: Record<string, unknown>) => ({
            id: String(r.id ?? r._id ?? ''),
            name: String(r.name ?? ''),
            displayName: String(r.displayName ?? r.name ?? ''),
          }))
        );
      } else {
        setRarities([]);
      }
    } catch (error) {
      console.error('Error loading rarities:', error);
      // Don't show toast for missing endpoints, just set empty array
      if ((error as { status?: number })?.status === 404) {

        setRarities([]);
      } else {
        toast.error('Error al cargar las rarezas');
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadLanguages = useCallback(async () => {
    try {
      setIsLoadingData(true);
      let response;
      try {
        response = await languagesAPI.getActive();
      } catch {
        // Fallback to list if active endpoint doesn't exist
        try {
          response = await languagesAPI.list();
        } catch {
          // If both endpoints fail, set empty array and continue
    
          setLanguages([]);
          return;
        }
      }
      if (response.success && response.data) {
        const langs = Array.isArray(response.data) ? response.data : [response.data];
        // Filter for active languages if needed (check isActive field)
        const activeLangs = langs.filter((l: Record<string, unknown>) => l.isActive !== false);
        setLanguages(
          activeLangs.map((l: Record<string, unknown>) => ({
            id: String(l.id ?? l._id ?? ''),
            name: String(l.name ?? ''),
            displayName: String(l.displayName ?? l.name ?? ''),
          }))
        );
      } else {
        setLanguages([]);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
      // Don't show toast for missing endpoints, just set empty array
      if ((error as { status?: number })?.status === 404) {

        setLanguages([]);
      } else {
        toast.error('Error al cargar los idiomas');
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await settingsAPI.get();
      if (data) {
        setImportationSettings({
          tax: parseFloat(data.importTaxRate || '0.2'),
          profit: parseFloat(data.profitRate || '0.2'),
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const addItem = useCallback(
    (item: AddProductData) => {


      const errors: Record<string, string> = {};

      if (!item.name || item.name.trim() === '') {
        errors.name = 'El nombre es requerido';
      }

      if (!item.price || item.price <= 0) {
        errors.price = 'El precio debe ser mayor a 0';
      }

      if (item.inStock === undefined || item.inStock === null) {
        item.inStock = 1;
      } else if (typeof item.inStock !== 'number' || item.inStock < 0) {
        errors.inStock = 'El stock debe ser un número mayor o igual a 0';
      }

      if (!item.categoryId || item.categoryId.trim() === '') {
        errors.categoryId = 'La categoría es requerida';
      }

      const category = categories.find((c) => c.id === item.categoryId);
      if (!category && item.categoryId) {
        errors.categoryId = `Categoría inválida: ${item.categoryId}`;
      }

      if (
        category?.name === 'SINGLES' ||
        item.category === 'SINGLES' ||
        item.category === 'cards'
      ) {
        if (!item.conditionId) {
          errors.conditionId = 'La condición es requerida';
        }
        if (!item.languageId) {
          errors.languageId = 'El idioma es requerido';
        }
      }

      if (Object.keys(errors).length > 0) {
        setState((prev) => ({
          ...prev,
          validationErrors: errors,
        }));
        return;
      }

      // Find exact duplicate: same importationId + same condition + same language + same foil
      // A card with different condition OR language is a different product → allow as new item
      const hasImportationId = !!item.importationId;
      let exactDuplicateIndex = -1;

      if (hasImportationId) {
        exactDuplicateIndex = state.items.findIndex(
          (existingItem) =>
            existingItem.importationId === item.importationId &&
            existingItem.conditionId === item.conditionId &&
            existingItem.languageId === item.languageId &&
            (existingItem.isFoil ?? false) === (item.isFoil ?? false)
        );
      }

      if (exactDuplicateIndex >= 0) {
        // Same card + same variant in pending list → increment stock instead of duplicating
        const added = item.inStock || 1;
        setState((prev) => {
          const updatedItems = [...prev.items];
          updatedItems[exactDuplicateIndex] = {
            ...updatedItems[exactDuplicateIndex],
            inStock: (updatedItems[exactDuplicateIndex].inStock || 1) + added,
          };
          return { ...prev, items: updatedItems, validationErrors: {} };
        });
        toast.info(`Stock de "${item.name}" incrementado (+${added})`);
        return;
      }

      setState((prev) => {
        const newItems = [...prev.items, item];

        return { ...prev, items: newItems, validationErrors: {} };
      });
    },
    [categories, state.items]
  );

  const addPendingItem = useCallback((item: AddProductData) => {
    // Add item as pending (will be shown in ItemsList for review)
    setState((prev) => ({
      ...prev,
      items: [...prev.items, item],
      validationErrors: {},
    }));
  }, []);

  const addItems = useCallback(
    (items: AddProductData[]) => {
      const validItems: AddProductData[] = [];
      const errors: Record<string, string> = {};

      items.forEach((item, index) => {
        const itemErrors: Record<string, string> = {};

        if (!item.name || item.name.trim() === '') {
          itemErrors[`item_${index}_name`] = 'El nombre es requerido';
        }

        if (!item.price || item.price <= 0) {
          itemErrors[`item_${index}_price`] = 'El precio debe ser mayor a 0';
        }

        if (item.inStock === undefined || item.inStock === null) {
          item.inStock = 1;
        } else if (typeof item.inStock !== 'number' || item.inStock < 0) {
          itemErrors[`item_${index}_inStock`] = 'El stock debe ser un número mayor o igual a 0';
        }

        if (!item.categoryId || item.categoryId.trim() === '') {
          itemErrors[`item_${index}_categoryId`] = 'La categoría es requerida';
        }

        const category = categories.find((c) => c.id === item.categoryId);
        if (!category && item.categoryId) {
          itemErrors[`item_${index}_categoryId`] = `Categoría inválida: ${item.categoryId}`;
        }

        if (
          category?.name === 'SINGLES' ||
          item.category === 'SINGLES' ||
          item.category === 'cards'
        ) {
          if (!item.conditionId) {
            itemErrors[`item_${index}_conditionId`] = 'La condición es requerida';
          }
          if (!item.languageId) {
            itemErrors[`item_${index}_languageId`] = 'El idioma es requerido';
          }
        }

        if (Object.keys(itemErrors).length === 0) {
          validItems.push(item);
        } else {
          Object.assign(errors, itemErrors);
        }
      });

      if (validItems.length > 0) {
        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...validItems],
          validationErrors: errors,
        }));

      }


    },
    [categories]
  );

  const updateItem = useCallback((index: number, item: Partial<AddProductData>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((existingItem, i) =>
        i === index ? { ...existingItem, ...item } : existingItem
      ),
      validationErrors: {},
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const clearAllItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [],
    }));
  }, []);

  const setSelectedOwner = useCallback((owner: User | null) => {
    setState((prev) => ({
      ...prev,
      selectedOwner: owner,
    }));
  }, []);

  const setSelectedCategory = useCallback((category: Category | null) => {
    setState((prev) => ({ ...prev, selectedCategory: category }));
  }, []);

  const searchImportation = useCallback(
    async (query: string, filters?: ImportationSearchFilters) => {
      if (!query.trim()) {
        setImportationSearchResults([]);
        return;
      }
      setIsSearchingImportation(true);
      try {
        const searchFilters = {
          ...filters,
          tax: importationSettings.tax,
          profit: importationSettings.profit,
        };
        const response = await cardSearchAPI.search(query.trim(), 1, 60, searchFilters);


        // Handle different response structures
        let cards: ImportationCard[] = [];

        // If response is directly an array
        if (Array.isArray(response)) {
          cards = response;
        }
        // If response has data property (nested structure)
        else if (response?.data) {
          // Check if data is an array
          if (Array.isArray(response.data)) {
            cards = response.data;
          }
          // Check if data.data exists (double nested)
          else if (response.data?.data && Array.isArray(response.data.data)) {
            cards = response.data.data;
          }
        }
        // If response has success property and data
        else if (response?.success && response.data) {
          cards = Array.isArray(response.data) ? response.data : [];
        }


        setImportationSearchResults(cards);
      } catch (error) {
        console.error('Error searching importation:', error);
        setImportationSearchResults([]);
      } finally {
        setIsSearchingImportation(false);
      }
    },
    [importationSettings.tax, importationSettings.profit]
  );

  const selectImportationCardDedup = useRef<{ lastCardId?: string; lastCallTime?: number }>({});

  const selectImportationCard = useCallback((card: ImportationCard) => {
    // Prevent multiple calls with the same card
    const cardId = card?.importationId || card?.productId || card?.id;
    const lastCalledId = selectImportationCardDedup.current.lastCardId;
    const lastCalledTime = selectImportationCardDedup.current.lastCallTime;
    const now = Date.now();

    // If same card called within 500ms, ignore
    if (lastCalledId === cardId && lastCalledTime && now - lastCalledTime < 500) {
      return;
    }

    selectImportationCardDedup.current.lastCardId = cardId;
    selectImportationCardDedup.current.lastCallTime = now;

    // Ensure bulkIsFoil is preserved when passing to form
    const cardToPass = {
      ...card,
      ...(card?.bulkIsFoil !== undefined && { bulkIsFoil: card.bulkIsFoil }),
    };

    // Trigger the form population via registry
    requestAnimationFrame(() => {
      if (hasCardSelectHandler()) {
        callCardSelectHandler(cardToPass);
      } else {
        // Retry after a short delay
        setTimeout(() => {
          if (hasCardSelectHandler()) {
            callCardSelectHandler(cardToPass);
          }
        }, 100);
      }
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (state.items.length === 0) {
      errors.items = 'Debe agregar al menos un producto';
    }

    state.items.forEach((item, index) => {
      if (!item.name.trim()) {
        errors[`item_${index}_name`] = 'El nombre es requerido';
      }
      if (item.price <= 0) {
        errors[`item_${index}_price`] = 'El precio debe ser mayor a 0';
      }
      if (!item.categoryId) {
        errors[`item_${index}_categoryId`] = 'La categoría es requerida';
      }
      if (item.inStock !== undefined && item.inStock !== null) {
        if (typeof item.inStock !== 'number' || item.inStock < 0) {
          errors[`item_${index}_inStock`] = 'El stock debe ser un número mayor o igual a 0';
        }
      }
    });

    setState((prev) => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  }, [state.items]);

  const submitProducts = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    if (!state.selectedOwner?.id) {
      toast.error('Debe seleccionar un propietario');
      setState((prev) => ({ ...prev, error: 'Debe seleccionar un propietario' }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      const results = await Promise.all(
        state.items.map(async (item) => {
          const createData = {
            borderless: item.isBorderless || false,
            cardName: (item.name || '').trim(),
            cardNumber: item.cardNumber || '',
            category_id: item.categoryId!,
            condition_id: item.conditionId!,
            expansion: item.expansion || '',
            extendedArt: item.extendedArt || false,
            finalPrice: Number(item.price) || 0,
            foil: item.isFoil || false,
            importationId: item.importationId || item.importationProductId || '',
            img: item.imageUrl || '',
            isLocalInventory: true,
            priceMxnImportation: item.priceMxnImportation || undefined,
            priceMxnLocal: item.priceMxnLocal || undefined,
            language_id: item.languageId!,
            link: item.importationLink || '',
            metadata: [],
            owner_id: state.selectedOwner!.id,
            prerelease: item.prerelease || false,
            premierPlay: item.premierPlay || false,
            stock: item.inStock || 1,
            surgeFoil: item.surgeFoil || false,
            tags: item.tags || [],
            variant: item.variant || item.expansion || null,
            tcg_id: item.tcgId || state.selectedTcg?.id,
          };

          const createResult = await singlesAPI.create(createData);

          if (createResult.success !== false) {
            return { action: 'created', product: createResult.data || createResult || item };
          }

          const errMsg =
            createResult.error || createResult.message || `Error creating product ${item.name}`;
          throw new Error(`Error creating product ${item.name}: ${errMsg}`);
        })
      );

      const createdCount = results.filter((r) => r.action === 'created').length;

      if (createdCount > 0) {
        toast.success(`${createdCount} producto(s) creado(s) correctamente`);
        // Clear items after successful submission
        setState((prev) => ({ ...prev, items: [] }));
      }

      return true;
    } catch (error) {
      console.error('Error submitting products:', error);
      const errorMessage = `Error al procesar los productos: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setState((prev) => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state.items, state.selectedOwner, state.selectedTcg, validateForm]);

  const resetForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [],
      selectedOwner: null,
      selectedCategory: null,
      selectedTcg: null,
      currentStep: 1,
      validationErrors: {},
      error: null,
    }));
  }, []);

  const setSelectedTcg = useCallback(
    (tcg: Tcg | null) => {
      setState((prev) => ({ ...prev, selectedTcg: tcg, selectedCategory: null }));
      if (tcg) {
        void loadCategories(tcg.id);
      } else {
        setCategories([]);
      }
    },
    [loadCategories]
  );

  return {
    ...state,
    owners,
    categories,
    tcgs,
    isAdmin,
    conditions,
    rarities,
    languages,
    importationSearchResults,
    isSearchingImportation,
    importationFilters,
    importationSettings,
    loading: isLoadingData || state.loading,
    error: state.error,
    addItem,
    addItems,
    addPendingItem,
    updateItem,
    removeItem,
    clearAllItems,
    setSelectedOwner,
    setSelectedCategory,
    setSelectedTcg,
    setLoading: (loading: boolean) => setState((prev) => ({ ...prev, loading })),
    setError: (error: string | null) => setState((prev) => ({ ...prev, error })),
    setCurrentStep: (step: number) => setState((prev) => ({ ...prev, currentStep: step })),
    setIsSubmitting: (submitting: boolean) =>
      setState((prev) => ({ ...prev, isSubmitting: submitting })),
    loadOwners,
    loadCategories,
    loadTcgs,
    loadConditions,
    loadRarities,
    loadLanguages,
    loadSettings,
    searchImportation,
    setImportationFilters,
    selectImportationCard,
    validateForm,
    setValidationError: (field: string, error: string) =>
      setState((prev) => ({
        ...prev,
        validationErrors: { ...prev.validationErrors, [field]: error },
      })),
    clearValidationErrors: () => setState((prev) => ({ ...prev, validationErrors: {} })),
    submitProducts,
    resetForm,
    nextStep: () =>
      setState((prev) => ({ ...prev, currentStep: Math.min(3, prev.currentStep + 1) })),
    prevStep: () =>
      setState((prev) => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) })),
  };
}
