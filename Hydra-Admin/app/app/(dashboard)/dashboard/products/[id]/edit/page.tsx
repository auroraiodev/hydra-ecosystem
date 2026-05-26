'use client';

import { useEffect, useReducer, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft24Regular, Save24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { singlesAPI, conditionsAPI, languagesAPI, categoriesAPI } from '@/lib/api';
import type { ApiProduct } from '../../types';

import { IdentificationCard } from './components/IdentificationCard';
import { PriceStockCard } from './components/PriceStockCard';
import { ClassificationCard } from './components/ClassificationCard';
import { FeaturesCard } from './components/FeaturesCard';
import { ProductImageCard } from './components/ProductImageCard';

interface MetadataItem {
  id: string;
  name: string;
  display_name?: string;
}

interface EditFormData {
  cardName: string;
  expansion: string;
  cardNumber: string;
  variant: string;
  finalPrice: string;
  stock: string;
  condition_id: string;
  language_id: string;
  category_id: string;
  img: string;
  foil: boolean;
  borderless: boolean;
  extendedArt: boolean;
  surgeFoil: boolean;
  prerelease: boolean;
  premierPlay: boolean;
}

interface EditPageState {
  product: ApiProduct | null;
  isLoading: boolean;
  isSubmitting: boolean;
  conditions: MetadataItem[];
  languages: MetadataItem[];
  categories: MetadataItem[];
  formData: EditFormData;
}

type EditPageAction =
  | { type: 'START_LOAD' }
  | { type: 'LOAD_SUCCESS'; product: ApiProduct; conditions: MetadataItem[]; languages: MetadataItem[]; categories: MetadataItem[]; formData: EditFormData }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'UPDATE_FORM'; field: keyof EditFormData; value: string | boolean };

function editPageReducer(state: EditPageState, action: EditPageAction): EditPageState {
  switch (action.type) {
    case 'START_LOAD': return { ...state, isLoading: true };
    case 'LOAD_SUCCESS': return { ...state, isLoading: false, product: action.product, conditions: action.conditions, languages: action.languages, categories: action.categories, formData: action.formData };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.isSubmitting };
    case 'UPDATE_FORM': return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    default: return state;
  }
}

const initialEditState: EditPageState = {
  product: null, isLoading: true, isSubmitting: false, conditions: [], languages: [], categories: [],
  formData: {
    cardName: '', expansion: '', cardNumber: '', variant: '', finalPrice: '', stock: '',
    condition_id: '', language_id: '', category_id: '', img: '',
    foil: false, borderless: false, extendedArt: false, surgeFoil: false, prerelease: false, premierPlay: false,
  },
};

function getArray(res: unknown): MetadataItem[] {
  if (Array.isArray(res)) return res as MetadataItem[];
  if (res && typeof res === 'object' && Array.isArray((res as { data: unknown }).data))
    return (res as { data: MetadataItem[] }).data;
  return [];
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { push } = useRouter();
  const [state, dispatch] = useReducer(editPageReducer, initialEditState);
  const { product, isLoading, isSubmitting, conditions, languages, categories, formData } = state;

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, condRes, langRes, catRes] = await Promise.all([
          singlesAPI.getById(id),
          conditionsAPI.list(),
          languagesAPI.list(),
          categoriesAPI.list(),
        ]);
        const p: ApiProduct = (productRes as { data?: ApiProduct })?.data ?? (productRes as ApiProduct);
        const price = p.finalPrice ?? p.price ?? 0;
        dispatch({
          type: 'LOAD_SUCCESS',
          product: p,
          conditions: getArray(condRes),
          languages: getArray(langRes),
          categories: getArray(catRes),
          formData: {
            cardName: p.cardName || p.name || p.title || '',
            expansion: p.expansion || '',
            cardNumber: p.cardNumber || '',
            variant: p.variant || '',
            finalPrice: String(price),
            stock: String(p.stock ?? p.in_stock ?? 0),
            condition_id: p.conditions?.id || p.condition_id || '',
            language_id: p.languages?.id || p.language_id || '',
            category_id: p.categories?.id || p.category_id || '',
            img: p.img || '',
            foil: p.foil || false,
            borderless: p.borderless || false,
            extendedArt: p.extendedArt || false,
            surgeFoil: p.surgeFoil || false,
            prerelease: p.prerelease || false,
            premierPlay: p.premierPlay || false,
          },
        });
      } catch { toast.error('Error al cargar'); push('/dashboard/products'); }
    };
    void load();
  }, [id, push]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardName.trim()) { toast.error('Nombre obligatorio'); return; }
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    try {
      await singlesAPI.update(id, {
        ...formData,
        cardName: formData.cardName.trim(),
        finalPrice: parseFloat(formData.finalPrice) || 0,
        stock: parseInt(formData.stock, 10) || 0,
      });
      toast.success('Actualizado');
      push('/dashboard/products');
    } catch { toast.error('Error al guardar'); }
    finally { dispatch({ type: 'SET_SUBMITTING', isSubmitting: false }); }
  };

  if (isLoading) return (
    <PageLayout>
      <PageHeader title="Editar" description="Cargando..." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map(key => <Skeleton key={key} className="h-16 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </PageLayout>
  );

  const update = (field: string, value: string | boolean) => {
    if (field in formData) {
      dispatch({ type: 'UPDATE_FORM', field: field as keyof EditFormData, value });
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={`Editar: ${product?.cardName || product?.name || 'Producto'}`}
        description={product?.expansion ? `Expansión: ${product.expansion}` : 'Modifica los campos y guarda los cambios'}
        action={<Button variant="outline" onClick={() => push('/dashboard/products')} className="gap-2"><ArrowLeft24Regular className="size-4" /> Volver</Button>}
      />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 pb-20">
        <div className="lg:col-span-2 space-y-6">
          <IdentificationCard {...formData} onChange={update} />
          <PriceStockCard finalPrice={formData.finalPrice} stock={formData.stock} onChange={update} />
          <ClassificationCard {...formData} conditions={conditions} languages={languages} categories={categories} onChange={update} />
          <FeaturesCard formData={formData} onChange={(f, v) => update(f, v)} />
        </div>

        <div className="space-y-6">
          <ProductImageCard img={formData.img} cardName={formData.cardName} onChange={(v) => update('img', v)} />
          {product?.importationId && (
            <Card>
              <CardHeader><CardTitle className="text-base">Referencia</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Importation ID:</span> {product.importationId}</p>
                {product.link && <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block">Ver en Importation →</a>}
              </CardContent>
            </Card>
          )}
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <SpinnerIos20Regular className="size-4 animate-spin" /> : <Save24Regular className="size-4" />}
              Guardar Cambios
            </Button>
            <Button type="button" variant="outline" onClick={() => push('/dashboard/products')} disabled={isSubmitting}>Cancelar</Button>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
