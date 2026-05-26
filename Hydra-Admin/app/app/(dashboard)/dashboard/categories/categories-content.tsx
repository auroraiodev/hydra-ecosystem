'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Add24Regular,
  ToggleLeft24Regular,
  ReOrder24Regular,
  ArrowCounterclockwise24Regular,
} from '@fluentui/react-icons';
import { categoriesAPI, maintenanceAPI, tcgsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

import { CategoriesSkeleton } from './components/CategoriesSkeleton';
import { CategoriesTable } from './components/CategoriesTable';
import { CategoryDialog } from './components/CategoryDialog';

type FormType = 'singles' | 'generic';

interface FormConfig {
  form_type?: FormType;
  fields: Record<string, { enabled: boolean; label?: string }>;
}

interface Tcg {
  id: string;
  name: string;
  display_name: string;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  order: number;
  image_url?: string;
  form_config?: FormConfig;
  tcgs?: Tcg[];
  _count?: {
    singles: number;
    local_singles?: number;
  };
}

interface FormState {
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  order: number;
  image_url: string;
  tcg_ids: string[];
  form_config: FormConfig;
}

const FORM_FIELDS = [
  { id: 'foil', label: 'Foil / Holográfico' },
  { id: 'condition', label: 'Condición / Estado' },
  { id: 'language', label: 'Idioma' },
  { id: 'expansion', label: 'Expansión / Edición' },
  { id: 'cardNumber', label: 'Número de carta' },
  { id: 'variant', label: 'Variante' },
  { id: 'borderless', label: 'Sin borde (Borderless)' },
  { id: 'extendedArt', label: 'Arte extendido' },
  { id: 'surgefoil', label: 'Surge Foil (Pokémon S&V)' },
  { id: 'prerelease', label: 'Prerelease' },
  { id: 'premierPlay', label: 'Premier Play' },
  { id: 'description', label: 'Descripción larga' },
  { id: 'tags', label: 'Etiquetas / Tags' },
  { id: 'images', label: 'Imágenes adicionales' },
];

const emptyForm = (): FormState => ({
  name: '',
  display_name: '',
  description: '',
  is_active: true,
  order: 0,
  image_url: '',
  tcg_ids: [],
  form_config: {
    form_type: 'generic',
    fields: FORM_FIELDS.reduce((acc, field) => ({ ...acc, [field.id]: { enabled: true } }), {}),
  },
});

function populateForm(cat: Category): FormState {
  return {
    name: cat.name,
    display_name: cat.display_name,
    description: cat.description || '',
    is_active: cat.is_active,
    order: cat.order,
    image_url: cat.image_url || '',
    tcg_ids: cat.tcgs?.map((t) => t.id) ?? [],
    form_config: {
      form_type: (cat.form_config?.form_type as FormType | undefined) ?? 'generic',
      fields: cat.form_config?.fields ? cat.form_config.fields : FORM_FIELDS.reduce((acc, field) => ({ ...acc, [field.id]: { enabled: true } }), {}),
    },
  };
}

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  isSubmitting: boolean;
  isClearingCache: boolean;
  allTcgs: Tcg[];
  dialog: {
    isOpen: boolean;
    editingCategory: Category | null;
    form: FormState;
  };
}

type CategoriesAction =
  | { type: 'SET_CATEGORIES'; categories: Category[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'SET_CLEARING_CACHE'; clearing: boolean }
  | { type: 'SET_ALL_TCGS'; tcgs: Tcg[] }
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; category: Category }
  | { type: 'SET_FORM'; data: Partial<FormState> }
  | { type: 'CLOSE_DIALOG' };

function categoriesReducer(state: CategoriesState, action: CategoriesAction): CategoriesState {
  switch (action.type) {
    case 'SET_CATEGORIES': return { ...state, categories: action.categories };
    case 'SET_LOADING': return { ...state, isLoading: action.loading };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.submitting };
    case 'SET_CLEARING_CACHE': return { ...state, isClearingCache: action.clearing };
    case 'SET_ALL_TCGS': return { ...state, allTcgs: action.tcgs };
    case 'OPEN_CREATE': return { ...state, dialog: { isOpen: true, editingCategory: null, form: emptyForm() } };
    case 'OPEN_EDIT': return { ...state, dialog: { isOpen: true, editingCategory: action.category, form: populateForm(action.category) } };
    case 'SET_FORM': return { ...state, dialog: { ...state.dialog, form: { ...state.dialog.form, ...action.data } } };
    case 'CLOSE_DIALOG': return { ...state, dialog: { ...state.dialog, isOpen: false } };
    default: return state;
  }
}

export default function CategoriesContent() {
  const [state, dispatch] = useReducer(categoriesReducer, {
    categories: [],
    isLoading: true,
    isSubmitting: false,
    isClearingCache: false,
    allTcgs: [],
    dialog: { isOpen: false, editingCategory: null, form: emptyForm() },
  });
  const { categories, isLoading, isSubmitting, isClearingCache, allTcgs, dialog } = state;

  const fetchTcgs = useCallback(async () => {
    try {
      const res = await tcgsAPI.list();
      dispatch({ type: 'SET_ALL_TCGS', tcgs: Array.isArray(res) ? res : res?.data || [] });
    } catch (err) { console.error('TCG fetch error:', err); }
  }, []);

  const fetchCategories = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await categoriesAPI.getAll();
      let data: Category[] = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && typeof res === 'object') {
        const r = res as { data?: Category[] | { data?: Category[] } };
        const inner = r.data;
        if (Array.isArray(inner)) {
          data = inner;
        } else if (inner && typeof inner === 'object') {
          data = (inner as { data?: Category[] }).data || [];
        }
      }
      dispatch({ type: 'SET_CATEGORIES', categories: data.sort((a, b) => a.order - b.order) });
    } catch { toast.error('Error al cargar categorías'); }
    finally { dispatch({ type: 'SET_LOADING', loading: false }); }
  }, []);

  useEffect(() => { void fetchCategories(); void fetchTcgs(); }, [fetchCategories, fetchTcgs]);

  const handleClearCache = async () => {
    dispatch({ type: 'SET_CLEARING_CACHE', clearing: true });
    try { await maintenanceAPI.clearCache(); toast.success('Caché limpiada'); }
    catch { toast.error('Error al limpiar caché'); }
    finally { dispatch({ type: 'SET_CLEARING_CACHE', clearing: false }); }
  };

  const handleSubmit = async () => {
    if (!dialog.form.name.trim() || !dialog.form.display_name.trim()) { toast.error('Nombre y nombre visible son obligatorios'); return; }
    dispatch({ type: 'SET_SUBMITTING', submitting: true });
    try {
      const payload: Partial<Category> & { tcg_ids?: string[] } = {
        name: dialog.form.name.trim().toUpperCase().replace(/\s+/g, '_'),
        display_name: dialog.form.display_name.trim(),
        is_active: dialog.form.is_active,
        order: Number(dialog.form.order) || 0,
        form_config: dialog.form.form_config,
        tcg_ids: dialog.form.tcg_ids,
      };
      if (dialog.form.description?.trim()) payload.description = dialog.form.description.trim();
      if (dialog.form.image_url?.trim()) payload.image_url = dialog.form.image_url.trim();

      if (dialog.editingCategory) await categoriesAPI.update(dialog.editingCategory.id, payload);
      else await categoriesAPI.create(payload);

      toast.success('Categoría guardada');
      dispatch({ type: 'CLOSE_DIALOG' });
      await fetchCategories();
      await handleClearCache();
    } catch { toast.error('Error al guardar'); }
    finally { dispatch({ type: 'SET_SUBMITTING', submitting: false }); }
  };

  const handleToggle = async (cat: Category) => {
    try {
      await categoriesAPI.toggleActive(cat.id);
      dispatch({ type: 'SET_CATEGORIES', categories: categories.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c) });
      toast.success('Estado cambiado');
      await handleClearCache();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar "${cat.display_name}"?`)) return;
    try {
      await categoriesAPI.delete(cat.id);
      dispatch({ type: 'SET_CATEGORIES', categories: categories.filter(c => c.id !== cat.id) });
      toast.success('Categoría eliminada');
      await handleClearCache();
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Categorías"
        description="Administra las categorías de productos"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearCache} disabled={isClearingCache}>
              <ArrowCounterclockwise24Regular className={`mr-2 size-4 ${isClearingCache ? 'animate-spin' : ''}`} />
              Refrescar Navegación
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/categories/linking"><ReOrder24Regular className="mr-2 size-4" /> Matriz de Vinculación</Link>
            </Button>
            <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })} size="sm"><Add24Regular className="mr-2 size-4" /> Nueva Categoría</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? <CategoriesSkeleton /> :
           categories.length === 0 ? <div className="py-16 text-center text-muted-foreground"><ToggleLeft24Regular className="size-10 mx-auto mb-3 opacity-40" /><p className="text-sm">No hay categorías.</p></div> :
           <CategoriesTable categories={categories} onToggle={handleToggle} onEdit={(cat) => dispatch({ type: 'OPEN_EDIT', category: cat })} onDelete={handleDelete} />
          }
        </CardContent>
      </Card>

      <CategoryDialog
        isOpen={dialog.isOpen}
        onClose={() => dispatch({ type: 'CLOSE_DIALOG' })}
        editingCategoryId={dialog.editingCategory?.id || null}
        form={dialog.form}
        onFormChange={(data) => dispatch({ type: 'SET_FORM', data })}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        allTcgs={allTcgs}
      />
    </PageLayout>
  );
}
