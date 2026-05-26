'use client';

import { useState, useCallback } from 'react';
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadOwners = useCallback(async () => {
    try {
      setIsLoadingData(true);

      // Role check via session endpoint instead of localStorage
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        const u = sessionData.user as {
          id?: string;
          _id?: string;
          email?: string;
          name?: string;
          first_name?: string;
          last_name?: string;
          username?: string;
          role?: string | { name: string };
          roleName?: string;
          phone?: string;
        };
        if (!u) {
          setOwners([]);
          return;
        }
        const userRoleName = typeof u.role === 'string' ? u.role : u.role?.name || u.roleName || '';
        const isAdminUser = userRoleName.toUpperCase() === 'ADMIN';
        setIsAdmin(isAdminUser);

        if (isAdminUser) {
          // If admin, load all owners
          try {
            const response = await usersAPI.list();
            // Handle response format from usersAPI.list()
            const usersArray = Array.isArray(response) ? response : response?.data || [];

            const mappedOwners = usersArray.map((user: Record<string, unknown>) => ({
              id: user.id || user._id,
              email: user.email,
              name:
                user.name ||
                `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                user.username ||
                user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone,
              isActive: user.is_active !== false,
              role: user.role,
            }));

            setOwners(mappedOwners);

            // Set current user as default if none selected
            const currentUser = mappedOwners.find(
              (o: Record<string, unknown>) => o.id === (u.id || u._id)
            );
            if (currentUser) {
              setState((prev) => ({ ...prev, selectedOwner: currentUser }));
            } else if (mappedOwners.length > 0) {
              setState((prev) => ({ ...prev, selectedOwner: mappedOwners[0] }));
            }
          } catch (apiError) {
            console.error('Error fetching all users for admin:', apiError);
            // Fallback to current user on error
            const fallbackUser = {
              id: u.id || u._id || '',
              email: u.email || '',
              name:
                u.name ||
                `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                u.username ||
                u.email ||
                '',
              role: typeof u.role === 'string' ? u.role : u.role?.name || '',
              isActive: true,
            };
            setOwners([fallbackUser]);
            setState((prev) => ({ ...prev, selectedOwner: fallbackUser }));
          }
        } else {
          // If seller, only show themselves
          const currentUser: User = {
            id: u.id || u._id || '',
            email: u.email || '',
            name:
              u.name ||
              `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
              u.username ||
              u.email ||
              '',
            firstName: u.first_name,
            lastName: u.last_name,
            phone: u.phone,
            isActive: true,
            role: typeof u.role === 'string' ? u.role : u.role?.name || '',
          };

          setOwners([currentUser]);
          setState((prev) => ({ ...prev, selectedOwner: currentUser }));
        }
      } else {
        setOwners([]);
      }
    } catch (error) {
      console.error('Error loading current user as owner:', error);
      setOwners([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadCategories = useCallback(async (tcgId?: string) => {
    try {
      setIsLoadingData(true);
      // GET /api/categories/active - Get active categories, optionally filtered by tcgId
      const response = await categoriesAPI.getActive(tcgId);

      // Handle different response structures
      interface RawCategoryResponse {
        id?: string;
        _id?: string;
        name: string;
        display_name?: string;
        displayName?: string;
        description?: string;
        is_active?: boolean;
        form_config?: unknown;
      }

      let categoriesArray: RawCategoryResponse[] = [];

      if (Array.isArray(response)) {
        categoriesArray = response as RawCategoryResponse[];
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesArray = response.data as RawCategoryResponse[];
      } else if (response?.success && response.data && Array.isArray(response.data)) {
        categoriesArray = response.data as RawCategoryResponse[];
      } else {
        console.warn('Unexpected categories response format:', response);
        categoriesArray = [];
      }

      setCategories(
        categoriesArray.map((c) => ({
          id: (c.id || c._id) as string,
          name: c.name,
          displayName: c.display_name || c.displayName || c.name,
          description: c.description,
          form_config: c.form_config,
        }))
      );
    } catch (error) {
      console.error('Error loading categories:', error);
      if ((error as { status?: number })?.status === 404) {
        console.warn('Categories endpoint not found, using empty array');
        setCategories([]);
      } else {
        toast.error('Error al cargar las categorías');
        setCategories([]);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadTcgs = useCallback(async () => {
    try {
      setIsLoadingData(true);
      // Fetch ALL TCGs for administrative use (inventory management)
      const res = (await tcgsAPI.list()) as Record<string, unknown>;

      let tcgsData: Tcg[] = [];
      if (Array.isArray(res)) {
        tcgsData = res as Tcg[];
      } else if (res.data && Array.isArray(res.data)) {
        tcgsData = res.data as Tcg[];
      } else if (res.success && res.data && Array.isArray(res.data)) {
        tcgsData = res.data as Tcg[];
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
        console.log('🔍 Conditions getActive response:', response);
      } catch (activeError: unknown) {
        console.log('⚠️ getActive failed, trying list:', activeError);
        // Fallback to list if active endpoint doesn't exist
        try {
          response = await conditionsAPI.list();
          console.log('🔍 Conditions list response:', response);
        } catch (listError: unknown) {
          // If both endpoints fail, use default conditions
          console.warn(
            '❌ Conditions endpoints not available, using default conditions',
            listError
          );
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

      console.log('📦 Processing conditions response:', response);
      console.log('📦 Response type:', typeof response);
      console.log('📦 Response keys:', response ? Object.keys(response) : 'null');

      if (response && (response.success || response.data || Array.isArray(response))) {
        let conds: Array<Record<string, unknown>> = [];

        // Handle different response structures (including double-nested data.data)
        if (Array.isArray(response)) {
          conds = response;
          console.log('✅ Using direct array response');
        } else if (response.data) {
          // Check if data.data exists (double nesting - this is the case from the API)
          if (response.data.data && Array.isArray(response.data.data)) {
            conds = response.data.data;
            console.log('✅ Using double-nested response.data.data');
          } else if (response.data.data && !Array.isArray(response.data.data)) {
            conds = [response.data.data];
            console.log('✅ Using single item from response.data.data');
          } else if (Array.isArray(response.data)) {
            conds = response.data;
            console.log('✅ Using response.data as array');
          } else {
            conds = [response.data];
            console.log('✅ Using response.data as single item');
          }
        } else if (response.success && response.data) {
          // Handle nested structure
          if (response.data.data && Array.isArray(response.data.data)) {
            conds = response.data.data;
            console.log('✅ Using double-nested response.data.data (success path)');
          } else if (Array.isArray(response.data)) {
            conds = response.data;
            console.log('✅ Using response.data as array (success path)');
          } else {
            conds = [response.data];
            console.log('✅ Using response.data as single item (success path)');
          }
        }

        console.log('📋 Raw conditions array:', conds);
        console.log('📋 Conditions count:', conds.length);

        // Filter for active conditions if needed (check isActive field)
        const activeConds = conds.filter((c) => {
          const isActive =
            c.isActive !== false &&
            c.isActive !== 'false' &&
            c.is_active !== false &&
            c.is_active !== 'false';
          console.log(
            `🔍 Condition ${c.name}: isActive=${c.isActive}, is_active=${c.is_active}, filtered=${isActive}`
          );
          return isActive;
        });

        console.log('✅ Active conditions after filter:', activeConds);
        console.log('✅ Active conditions count:', activeConds.length);

        const mappedConditions = activeConds.map((c) => ({
          id: String(c.id ?? c._id ?? ''),
          name: String(c.name ?? ''),
          displayName: String(c.displayName ?? c.display_name ?? c.name ?? ''),
        }));

        console.log('🎯 Final mapped conditions:', mappedConditions);
        console.log('🎯 Final mapped conditions count:', mappedConditions.length);
        setConditions(mappedConditions);
      } else {
        console.warn('⚠️ No conditions in response, using default conditions');
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
      console.error('❌ Error loading conditions:', error);
      // Use default conditions when endpoint is not available
      if ((error as { status?: number })?.status === 404) {
        console.warn('Conditions endpoint not found, using default conditions');
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
          console.warn('Rarities endpoints not available, using empty array');
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
        console.warn('Rarities endpoint not found, using empty array');
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
          console.warn('Languages endpoints not available, using empty array');
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
        console.warn('Languages endpoint not found, using empty array');
        setLanguages([]);
      } else {
        toast.error('Error al cargar los idiomas');
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const addItem = useCallback(
    (item: AddProductData) => {
      console.log('🔵 addItem called with:', {
        name: item.name,
        price: item.price,
        categoryId: item.categoryId,
        conditionId: item.conditionId,
        languageId: item.languageId,
      });

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
          console.log('❌ Error: conditionId faltante');
        }
        if (!item.languageId) {
          errors.languageId = 'El idioma es requerido';
          console.log('❌ Error: languageId faltante');
        }
      }

      if (Object.keys(errors).length > 0) {
        console.log('❌ Errores de validación:', errors);
        setState((prev) => ({
          ...prev,
          validationErrors: errors,
        }));
        return;
      }

      console.log('✅ Validación pasada, agregando item al estado');

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
        console.log('📦 Estado actualizado - Total items:', newItems.length);
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
        console.log(`✅ ${validItems.length} item(s) agregado(s) correctamente`);
      }

      if (Object.keys(errors).length > 0) {
        console.log('❌ Algunos items tienen errores de validación:', errors);
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
        const response = await cardSearchAPI.search(query.trim(), 1, 60, filters);
        console.log('🔍 Importation search response:', response);

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

        console.log('📦 Processed cards:', cards.length, cards.slice(0, 3));
        setImportationSearchResults(cards);
      } catch (error) {
        console.error('Error searching Importation:', error);
        setImportationSearchResults([]);
      } finally {
        setIsSearchingImportation(false);
      }
    },
    []
  );

  const selectImportationCard = useCallback((card: ImportationCard) => {
    // Prevent multiple calls with the same card
    const cardId = card?.importationId || card?.productId || card?.id;
    const lastCalledId = (selectImportationCard as unknown as { __lastCardId?: string })
      .__lastCardId;
    const lastCalledTime = (selectImportationCard as unknown as { __lastCallTime?: number })
      .__lastCallTime;
    const now = Date.now();

    // If same card called within 500ms, ignore
    if (lastCalledId === cardId && lastCalledTime && now - lastCalledTime < 500) {
      console.log('⏭️ Ignoring duplicate call for card:', cardId);
      return;
    }

    (selectImportationCard as unknown as { __lastCardId?: string }).__lastCardId = cardId;
    (selectImportationCard as unknown as { __lastCallTime?: number }).__lastCallTime = now;

    console.log('🎯 [useAddProduct] ========== selectImportationCard CALLED ==========');
    console.log('🎯 [useAddProduct] Full card object received:', card);
    console.log('🎯 [useAddProduct] Card summary:', {
      name: card?.name || card?.title || card?.cardName,
      id: cardId,
      bulkIsFoil: card?.bulkIsFoil,
      bulkIsFoilType: typeof card?.bulkIsFoil,
      hasBulkIsFoil: 'bulkIsFoil' in (card || {}),
      foil: card?.foil,
      isFoil: card?.isFoil,
      cardKeys: card ? Object.keys(card) : [],
    });

    // Ensure bulkIsFoil is preserved when passing to form
    // Create a new object to ensure all properties are preserved
    const cardToPass = {
      ...card,
      // Explicitly preserve bulkIsFoil if it exists
      ...(card?.bulkIsFoil !== undefined && { bulkIsFoil: card.bulkIsFoil }),
    };

    console.log('🎯 [useAddProduct] Card to pass - bulkIsFoil preserved:', {
      bulkIsFoil: cardToPass?.bulkIsFoil,
      hasBulkIsFoil: 'bulkIsFoil' in (cardToPass || {}),
      bulkIsFoilType: typeof cardToPass?.bulkIsFoil,
    });

    // Trigger the form population by calling the handler stored in window
    // Use requestAnimationFrame for immediate execution
    requestAnimationFrame(() => {
      if (
        typeof window !== 'undefined' &&
        (window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void })
          .__handleBulkImportCardSelect
      ) {
        console.log(
          '🔄 [useAddProduct] Calling __handleBulkImportCardSelect with FULL card object:',
          cardToPass
        );
        console.log('🔄 [useAddProduct] Card bulkIsFoil check:', {
          bulkIsFoil: cardToPass?.bulkIsFoil,
          hasBulkIsFoil: 'bulkIsFoil' in (cardToPass || {}),
          bulkIsFoilType: typeof cardToPass?.bulkIsFoil,
        });
        (window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void })
          .__handleBulkImportCardSelect!(cardToPass);
      } else {
        console.warn('⚠️ Form handler not available, retrying...');
        // Retry after a short delay
        setTimeout(() => {
          if (
            typeof window !== 'undefined' &&
            (window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void })
              .__handleBulkImportCardSelect
          ) {
            console.log(
              '🔄 [useAddProduct] Retry: Calling __handleBulkImportCardSelect with FULL card object:',
              cardToPass
            );
            console.log('🔄 [useAddProduct] Retry: Card bulkIsFoil check:', {
              bulkIsFoil: cardToPass?.bulkIsFoil,
              hasBulkIsFoil: 'bulkIsFoil' in (cardToPass || {}),
              bulkIsFoilType: typeof cardToPass?.bulkIsFoil,
            });
            (window as Window & { __handleBulkImportCardSelect?: (card: ImportationCard) => void })
              .__handleBulkImportCardSelect!(cardToPass);
          } else {
            console.error('❌ Form handler not available after retry');
          }
        }, 100);
      }
    });
    console.log('🎯 [useAddProduct] ========== selectImportationCard END ==========');
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
          try {
            // Map item data to CreateSingleDto format (no wrapper, direct fields)
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

            // Handle different response structures
            if (createResult.success !== false) {
              return { action: 'created', product: createResult.data || createResult || item };
            } else {
              throw new Error(
                createResult.error || createResult.message || `Error creating product ${item.name}`
              );
            }
          } catch (createError: unknown) {
            const err = createError as { message?: string; error?: string };
            const errorMessage = err?.message || err?.error || 'Unknown error';
            throw new Error(`Error creating product ${item.name}: ${errorMessage}`);
          }
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
