import { useState, useEffect, useCallback, useReducer, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { getProduct, getAlternativeVersions, fetchValuedPrice, type Product } from '../utils';
import { searchLocal } from '@/features/search-filters/utils';
import { getImportationPrice } from '@/lib/api/importation';
import type { AltItem } from '../types';
import type { ReadonlyURLSearchParams } from 'next/navigation';
export type { AltItem };

export function useProductDetails(
  searchParams: ReadonlyURLSearchParams,
  initialProduct?: Product | null,
  initialAlternativeVersions: AltItem[] = [],
  initialRelatedProducts: AltItem[] = []
) {
  const params = useParams();
  const sp = searchParams;
  const id = params?.id as string;
  const selectedCard = useAppSelector((state) => state.selectedProduct.card);

  const nameParam = sp?.get('name');
  const priceParam = sp?.get('price');
  const conditionParam = sp?.get('condition');
  const languageParam = sp?.get('language');
  const imgParam = sp?.get('img');
  const isLocalInventoryParam = sp?.get('isLocalInventory');
  const expansionParam = sp?.get('expansion');
  const foilParam = sp?.get('foil');
  const surgeFoilParam = sp?.get('surgeFoil');

  const productFromParams: Product | null = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (!nameParam || initialProduct) return null;
    return {
      id,
      name: nameParam,
      cardName: nameParam,
      price: parseFloat(priceParam || '0') || 0,
      stock: 0,
      imageUrl: imgParam || undefined,
      img: imgParam || undefined,
      isLocalInventory: isLocalInventoryParam === 'true',
      expansion: expansionParam || undefined,
      conditions: conditionParam ? { name: conditionParam, display_name: conditionParam } : undefined,
      languages: languageParam ? { name: languageParam, display_name: languageParam } : undefined,
      foil: foilParam === '1',
      surgeFoil: surgeFoilParam === '1',
      importationId: id.match(/^(\d+)/)?.[1] || id,
    };
  }, [
    id,
    initialProduct,
    nameParam,
    priceParam,
    conditionParam,
    languageParam,
    imgParam,
    isLocalInventoryParam,
    expansionParam,
    foilParam,
    surgeFoilParam,
  ]);

  type ProductAction =
    | { type: 'SET_PRODUCT'; payload: Product | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

  const [state, dispatch] = useReducer(
    (
      prev: { product: Product | null; loading: boolean; error: string | null },
      action: ProductAction
    ) => {
      switch (action.type) {
        case 'SET_PRODUCT':
          return { ...prev, product: action.payload };
        case 'SET_LOADING':
          return { ...prev, loading: action.payload };
        case 'SET_ERROR':
          return { ...prev, error: action.payload };
        default:
          return prev;
      }
    },
    {
      product: (() => {
        if (initialProduct) {
          // If the server returned price=0 but the URL carries the real price (from search card),
          // patch it so the detail page always shows the correct price.
          if (initialProduct.price === 0) {
            const urlPrice = parseFloat(
              typeof window !== 'undefined' ? (sp?.get('price') ?? '0') : '0'
            );
            if (urlPrice > 0) return { ...initialProduct, price: urlPrice };
          }
          return initialProduct;
        }
        return productFromParams || null;
      })(),
      loading: !initialProduct && !productFromParams,
      error: null as string | null,
    }
  );
  const { product, loading, error } = state;

  // Sync with selectedCard from Redux if we don't have a product or it's a shell
  const [prevSelectedCard, setPrevSelectedCard] = useState(selectedCard);
  if (selectedCard && selectedCard !== prevSelectedCard && !initialProduct) {
    const shouldInit = !product || (product.id === id && !product.description);
    if (shouldInit) {
      const priceNum = parseFloat((selectedCard.price ?? '0').replace(/[^0-9.]/g, ''));
      const fallbackProduct: Product = {
        id: selectedCard.id,
        name: selectedCard.title,
        cardName: selectedCard.cardName || selectedCard.title,
        price: isNaN(priceNum) ? 0 : priceNum,
        stock: selectedCard.stock ?? 0,
        imageUrl: selectedCard.imageUrl || undefined,
        img: selectedCard.imageUrl || undefined,
        importationId: selectedCard.importationId ?? null,
        isLocalInventory: selectedCard.isLocalInventory ?? false,
        conditions: {
          name: selectedCard.condition || 'Near Mint',
          display_name: selectedCard.condition || 'Near Mint',
        },
        languages: {
          name: selectedCard.language || 'English',
          display_name: selectedCard.language || 'Inglés',
        },
        expansion: selectedCard.expansion,
        variant: selectedCard.variant,
        foil: selectedCard.foil,
        surgeFoil: selectedCard.surgeFoil,
        metadata: selectedCard.metadata ?? [],
      };
      dispatch({ type: 'SET_PRODUCT', payload: fallbackProduct });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    setPrevSelectedCard(selectedCard);
  }

  const buildShareUrl = useCallback((): string => {
    if (typeof window === 'undefined' || !product) return '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      product.id || ''
    );
    if (!isUuid) {
      const p = new URLSearchParams();
      const name = product.name || product.cardName;
      if (name) p.set('name', name);
      if (product.price) p.set('price', String(product.price));
      const img = product.imageUrl || product.img;
      if (img) p.set('img', img);
      if (product.expansion) p.set('expansion', product.expansion);
      const condition = product.conditions?.display_name || product.conditions?.name;
      if (condition) p.set('condition', condition);
      const language = product.languages?.display_name || product.languages?.name;
      if (language) p.set('language', language);
      if (product.foil) p.set('foil', '1');
      if (product.surgeFoil) p.set('surgeFoil', '1');
      return `${window.location.origin}/singles/${product.id}?${p.toString()}`;
    }
    // For UUIDs, return the clean canonical URL without query params
    return window.location.origin + window.location.pathname;
  }, [product]);

  useEffect(() => {
    if (!product || typeof window === 'undefined') return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      product.id || ''
    );
    if (!isUuid && !sp?.get('name') && (product.name || product.cardName)) {
      const enrichedUrl = buildShareUrl();
      if (enrichedUrl) window.history.replaceState(null, '', enrichedUrl);
    }
  }, [product, sp, buildShareUrl]);

  const isFetched = useRef(false);
  const livePriceFetchedFor = useRef<string | null>(null);

  useEffect(() => {
    isFetched.current = false;
    livePriceFetchedFor.current = null;
  }, [id]);

  useEffect(() => {
    if (initialProduct && product && product.price > 0) {
      return;
    }
    if (isFetched.current) return;

    const fetchProduct = async () => {
      isFetched.current = true;
      try {
        let realId = id;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUuid && id.includes('-')) {
          const match = id.match(/^(\d+)-/);
          if (match) realId = match[1];
        }
        if (isUuid) {
          const data = await getProduct(realId);
          let resolvedPrice = data.price ?? (data as { finalPrice?: number }).finalPrice ?? product?.price ?? 0;
          if (resolvedPrice <= 0) {
            const fetchedPriceVal = await fetchValuedPrice(realId, data.name || data.cardName);
            if (fetchedPriceVal > 0) {
              resolvedPrice = fetchedPriceVal;
            }
          }
          dispatch({
            type: 'SET_PRODUCT',
            payload: {
              ...data,
              price: resolvedPrice,
            },
          });
        } else {
          try {
            const nameFromUrl = sp?.get('name') ?? undefined;
            const languageFromUrl = sp?.get('language') ?? undefined;
            const data = await getProduct(realId, nameFromUrl, languageFromUrl);
            let resolvedPrice = data.price ?? (data as { finalPrice?: number }).finalPrice ?? productFromParams?.price ?? 0;
            if (resolvedPrice <= 0) {
              const fetchedPriceVal = await fetchValuedPrice(realId, data.name || data.cardName || nameFromUrl, languageFromUrl);
              if (fetchedPriceVal > 0) {
                resolvedPrice = fetchedPriceVal;
              }
            }
            dispatch({
              type: 'SET_PRODUCT',
              payload: {
                ...data,
                price: resolvedPrice,
              },
            });
          } catch {
            if (productFromParams) dispatch({ type: 'SET_PRODUCT', payload: productFromParams });
            else dispatch({ type: 'SET_ERROR', payload: 'Producto no encontrado' });
          }
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (err) {
        const error = err as Error;
        if (error.message !== 'Producto no encontrado')
          console.error('Error fetching product:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al cargar el producto' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    if (id) fetchProduct();
  }, [id, initialProduct, selectedCard, sp, product, productFromParams, dispatch]);

  const [alternativeVersions, setAlternativeVersions] = useState<AltItem[]>(
    initialAlternativeVersions
  );

  useEffect(() => {
    const fetchAlternatives = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        product?.id || ''
      );
      if (!product?.id || !isUuid) return;
      try {
        const data = await getAlternativeVersions(product.id, 4);
        setAlternativeVersions(data);
      } catch (err) {
        console.error('Error fetching alternative versions:', err);
      }
    };
    if (product && alternativeVersions.length === 0) fetchAlternatives();
  }, [product, alternativeVersions.length]);

  const [relatedProducts, setRelatedProducts] = useState<AltItem[]>(initialRelatedProducts);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.expansion) return;
      try {
        const response = await searchLocal({ q: product.expansion, limit: 8, paginate: false });
        const items = response.data || [];
        const filtered = (items as unknown as AltItem[])
          .filter((item) => item.id !== product.id)
          .slice(0, 4)
          .map((item) => ({
            ...item,
            imageUrl: item.img || item.imageUrl || '/placeholder-product.png',
          }));
        setRelatedProducts(filtered);
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };
    if (product?.expansion && relatedProducts.length === 0) fetchRelated();
  }, [product?.expansion, product?.id, relatedProducts.length]);

  // Fetch live price for importation products
  useEffect(() => {
    if (!product || !product.importationId) return;
    if (livePriceFetchedFor.current === product.id) return;

    const cardName = product.cardName || product.name;
    const language = product.languages?.name || product.languages?.display_name || 'ENGLISH';
    const isFoil = product.foil === true;

    if (!cardName) return;

    livePriceFetchedFor.current = product.id;

    getImportationPrice(product.importationId, cardName, isFoil, language).then((variant) => {
      if (!variant) return;
      const livePrice = product.isLocalInventory
        ? variant.price_mxn_local
        : variant.price_mxn_importation;
      if (livePrice > 0) {
        dispatch({
          type: 'SET_PRODUCT',
          payload: { ...product, price: livePrice, price_mxn_importation: variant.price_mxn_importation, price_mxn_local: variant.price_mxn_local },
        });
      }
    });
  }, [product]);

  return { product, loading, error, alternativeVersions, relatedProducts, buildShareUrl };
}
