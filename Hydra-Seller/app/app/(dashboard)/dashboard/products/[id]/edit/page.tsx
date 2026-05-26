'use client';

import { useEffect, useReducer, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft24Regular, Save24Regular, SpinnerIos20Regular } from '@fluentui/react-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { singlesAPI, conditionsAPI, languagesAPI, categoriesAPI } from '@/lib/api';
import type { ApiProduct } from '../../types';

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
  error: string | null;
  isSubmitting: boolean;
  conditions: MetadataItem[];
  languages: MetadataItem[];
  categories: MetadataItem[];
  formData: EditFormData;
}

type EditPageAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; product: ApiProduct; conditions: MetadataItem[]; languages: MetadataItem[]; categories: MetadataItem[]; formData: EditFormData }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'UPDATE_FORM'; field: keyof EditFormData; value: string | boolean };

function editPageReducer(state: EditPageState, action: EditPageAction): EditPageState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true };
    case 'LOAD_SUCCESS':
      return { ...state, isLoading: false, product: action.product, conditions: action.conditions, languages: action.languages, categories: action.categories, formData: action.formData };
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'UPDATE_FORM':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EditLoadingSkeleton() {
  return (
    <PageLayout>
      <PageHeader title="Editar Producto" description="Cargando..." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 4 }, (_, n) => n + 1).map((n) => (
            <Skeleton key={`skel-${n}`} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </PageLayout>
  );
}

interface EditErrorStateProps {
  error: string;
  push: (url: string) => void;
}

function EditErrorState({ error, push }: EditErrorStateProps) {
  return (
    <PageLayout>
      <PageHeader
        title="Error"
        description={error}
        action={
          <Button
            variant="outline"
            onClick={() => push('/dashboard/products')}
            className="flex items-center gap-2"
          >
            <ArrowLeft24Regular className="size-4" />
            Volver al Inventario
          </Button>
        }
      />
    </PageLayout>
  );
}

interface SpecialFeaturesCardProps {
  formData: EditFormData;
  set: (field: keyof EditFormData, value: string | boolean) => void;
}

function SpecialFeaturesCard({ formData, set }: SpecialFeaturesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Características Especiales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(
            [
              { key: 'foil', label: 'Foil' },
              { key: 'borderless', label: 'Borderless' },
              { key: 'extendedArt', label: 'Extended Art' },
              { key: 'surgeFoil', label: 'Surge Foil' },
              { key: 'prerelease', label: 'Prerelease' },
              { key: 'premierPlay', label: 'Premier Play' },
            ] as { key: keyof EditFormData; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData[key] as boolean}
                onChange={(e) => set(key, e.target.checked)}
                className="size-4 rounded border-neutral-300 accent-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ImageSidebarCardProps {
  formData: EditFormData;
  set: (field: keyof EditFormData, value: string | boolean) => void;
}

function ImageSidebarCard({ formData, set }: ImageSidebarCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Imagen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {formData.img ? (
          <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-100">
            <Image
              src={formData.img}
              alt={formData.cardName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="aspect-[3/4] rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
            Sin imagen
          </div>
        )}
        <div>
          <Label htmlFor="img">URL de Imagen</Label>
          <Input
            id="img"
            value={formData.img}
            onChange={(e) => set('img', e.target.value)}
            placeholder="https://..."
            className="mt-1 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function getArray(res: unknown): MetadataItem[] {
  if (Array.isArray(res)) return res as MetadataItem[];
  if (res && typeof res === 'object' && Array.isArray((res as { data: unknown }).data))
    return (res as { data: MetadataItem[] }).data;
  return [];
}

const initialFormData: EditFormData = {
  cardName: '', expansion: '', cardNumber: '', variant: '',
  finalPrice: '', stock: '', condition_id: '', language_id: '',
  category_id: '', img: '', foil: false, borderless: false,
  extendedArt: false, surgeFoil: false, prerelease: false, premierPlay: false,
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { push } = useRouter();
  const [state, dispatch] = useReducer(editPageReducer, {
    product: null,
    isLoading: true,
    error: null,
    isSubmitting: false,
    conditions: [],
    languages: [],
    categories: [],
    formData: initialFormData,
  });
  const { product, isLoading, error, isSubmitting, conditions, languages, categories, formData } = state;

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, condRes, langRes, catRes] = await Promise.all([
          singlesAPI.getById(id),
          conditionsAPI.list(),
          languagesAPI.list(),
          categoriesAPI.list(),
        ]);

        const p = productRes as ApiProduct;
        const price = p.finalPrice ?? p.price ?? 0;
        dispatch({
          type: 'LOAD_SUCCESS',
          product: p,
          conditions: getArray(condRes),
          languages: getArray(langRes),
          categories: getArray(catRes),
          formData: {
            ...initialFormData,
            cardName: p.cardName || p.name || p.title || '',
            expansion: p.expansion || '',
            cardNumber: p.cardNumber || '',
            variant: p.variant || '',
            finalPrice: typeof price === 'number' ? price.toString() : String(price),
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
      } catch (err) {
        console.error(err);
        dispatch({ type: 'LOAD_ERROR', error: 'No se pudo cargar el producto' });
      }
    };
    void load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardName.trim()) {
      toast.error('El nombre de la carta es obligatorio');
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    try {
      await singlesAPI.update(id, {
        cardName: formData.cardName.trim(),
        expansion: formData.expansion.trim() || undefined,
        cardNumber: formData.cardNumber.trim() || undefined,
        variant: formData.variant.trim() || undefined,
        finalPrice: parseFloat(formData.finalPrice) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        condition_id: formData.condition_id || undefined,
        language_id: formData.language_id || undefined,
        category_id: formData.category_id || undefined,
        img: formData.img.trim() || undefined,
        foil: formData.foil,
        borderless: formData.borderless,
        extendedArt: formData.extendedArt,
        surgeFoil: formData.surgeFoil,
        prerelease: formData.prerelease,
        premierPlay: formData.premierPlay,
      });
      toast.success('Producto actualizado');
      push('/dashboard/products');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los cambios');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const set = (field: keyof EditFormData, value: string | boolean) =>
    dispatch({ type: 'UPDATE_FORM', field, value });

  if (isLoading) return <EditLoadingSkeleton />;
  if (error) return <EditErrorState error={error} push={push} />;

  return (
    <PageLayout>
      <PageHeader
        title={`Editar: ${product?.cardName || product?.name || 'Producto'}`}
        description={
          product?.expansion
            ? `Expansión: ${product.expansion}`
            : 'Modifica los campos y guarda los cambios'
        }
        action={
          <Button
            variant="outline"
            onClick={() => push('/dashboard/products')}
            className="flex items-center gap-2"
          >
            <ArrowLeft24Regular className="size-4" />
            Volver al Inventario
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identificación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Nombre de la Carta *</Label>
                  <Input
                    id="cardName"
                    value={formData.cardName}
                    onChange={(e) => set('cardName', e.target.value)}
                    placeholder="Ej. Ral, Storm Conduit"
                    required
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expansion">Expansión</Label>
                    <Input
                      id="expansion"
                      value={formData.expansion}
                      onChange={(e) => set('expansion', e.target.value)}
                      placeholder="Ej. LTR, M21"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Número de Carta</Label>
                    <Input
                      id="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => set('cardNumber', e.target.value)}
                      placeholder="Ej. 451"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="variant">Variante</Label>
                  <Input
                    id="variant"
                    value={formData.variant}
                    onChange={(e) => set('variant', e.target.value)}
                    placeholder="Ej. The List, Showcase, etc."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Precio y stock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Precio y Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="finalPrice">Precio Final (MXN) *</Label>
                    <Input
                      id="finalPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.finalPrice}
                      onChange={(e) => set('finalPrice', e.target.value)}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={(e) => set('stock', e.target.value)}
                      placeholder="1"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clasificación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clasificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="condition">Condición</Label>
                    <select
                      id="condition"
                      value={formData.condition_id}
                      onChange={(e) => set('condition_id', e.target.value)}
                      className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="">Sin cambios</option>
                      {conditions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.display_name || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <select
                      id="language"
                      value={formData.language_id}
                      onChange={(e) => set('language_id', e.target.value)}
                      className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="">Sin cambios</option>
                      {languages.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.display_name || l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <select
                      id="category"
                      value={formData.category_id}
                      onChange={(e) => set('category_id', e.target.value)}
                      className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="">Sin cambios</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.display_name || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Características especiales */}
            <SpecialFeaturesCard formData={formData} set={set} />
          </div>

          {/* Sidebar: imagen + acciones */}
          <div className="space-y-6">
            {/* Preview imagen */}
            <ImageSidebarCard formData={formData} set={set} />

            {/* Info de solo lectura */}
            {product?.importationId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Referencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Importation ID:</span>{' '}
                    {product.importationId}
                  </p>
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block"
                    >
                      Ver en Importation →
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Acción guardar */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIos20Regular className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save24Regular className="size-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => push('/dashboard/products')}
                disabled={isSubmitting}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
