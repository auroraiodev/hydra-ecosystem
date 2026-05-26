'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  SpinnerIos20Regular,
  ToggleLeft24Regular,
  Box24Regular,
} from '@fluentui/react-icons';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface FormConfig {
  fields: Record<string, { enabled: boolean; label?: string }>;
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
  _count?: { singles: number };
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
  { id: 'prerelease', label: 'Prerelease' },
  { id: 'premierPlay', label: 'Premier Play' },
  { id: 'description', label: 'Descripción larga' },
  { id: 'tags', label: 'Etiquetas / Tags' },
  { id: 'images', label: 'Imágenes adicionales' },
];

const emptyForm = (): Omit<Category, 'id' | '_count'> => ({
  name: '',
  display_name: '',
  description: '',
  is_active: true,
  order: 0,
  image_url: '',
  form_config: {
    fields: FORM_FIELDS.reduce(
      (acc, field) => ({
        ...acc,
        [field.id]: { enabled: true },
      }),
      {}
    ),
  },
});

// ── Sub-components ────────────────────────────────────────────────────────────

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onToggle: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CategoriesTable({ categories, onEdit, onToggle, onDelete }: CategoriesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="p-3 text-left font-semibold">Orden</th>
            <th className="p-3 text-left font-semibold w-[60px]">Imagen</th>
            <th className="p-3 text-left font-semibold">Código</th>
            <th className="p-3 text-left font-semibold">Nombre visible</th>
            <th className="p-3 text-left font-semibold">Descripción</th>
            <th className="p-3 text-left font-semibold">Productos</th>
            <th className="p-3 text-left font-semibold">Estado</th>
            <th className="p-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-3 text-muted-foreground">{cat.order}</td>
              <td className="p-3">
                {cat.image_url ? (
                  <div className="size-8 rounded bg-muted overflow-hidden relative">
                    <Image src={resolveImageUrl(cat.image_url)} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  </div>
                ) : (
                  <div className="size-8 rounded bg-muted flex items-center justify-center">
                    <Box24Regular className="size-4 text-muted-foreground/40" />
                  </div>
                )}
              </td>
              <td className="p-3">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.name}</code>
              </td>
              <td className="p-3 font-medium">{cat.display_name}</td>
              <td className="p-3 text-muted-foreground max-w-[200px] truncate">{cat.description || '-'}</td>
              <td className="p-3">
                {cat._count?.singles != null ? (
                  <Badge variant="secondary">{cat._count.singles}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3">
                <Badge
                  variant={cat.is_active ? 'default' : 'outline'}
                  className={cat.is_active ? 'bg-green-100 text-green-800 border-none' : 'text-muted-foreground'}
                >
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="size-8" title={cat.is_active ? 'Desactivar' : 'Activar'} onClick={() => onToggle(cat)}>
                    <ToggleLeft24Regular className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(cat)}>
                    <Edit24Regular className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => onDelete(cat)}>
                    <Delete24Regular className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CategoryFormFieldsProps {
  form: ReturnType<typeof emptyForm>;
  onChange: (updated: Partial<ReturnType<typeof emptyForm>>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CategoryFormFields({ form, onChange }: CategoryFormFieldsProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Nombre visible <span className="text-destructive">*</span></Label>
        <Input placeholder="Ej. Cartas Individuales" value={form.display_name} onChange={(e) => onChange({ display_name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Código interno <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Ej. SINGLES"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
        />
        <p className="text-xs text-muted-foreground">Se convierte automáticamente a mayúsculas y sin espacios.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Input placeholder="Opcional" value={form.description} onChange={(e) => onChange({ description: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Imagen (URL)</Label>
        <Input placeholder="https://... o ruta local" value={form.image_url || ''} onChange={(e) => onChange({ image_url: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Orden de visualización</Label>
        <Input type="number" min={0} placeholder="0" value={String(form.order)} onChange={(e) => onChange({ order: Number(e.target.value) })} />
      </div>
      <div className="flex items-center gap-3">
        <Switch id="is_active" checked={form.is_active} onCheckedChange={(_, data) => onChange({ is_active: data.checked })} />
        <Label htmlFor="is_active">Activa</Label>
      </div>
      <div className="pt-4 border-t">
        <h4 className="text-sm font-semibold mb-3">Configuración de campos capturables</h4>
        <p className="text-xs text-muted-foreground mb-4">Selecciona qué campos aparecerán en el formulario de registro para esta categoría.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FORM_FIELDS.map((field) => (
            <div key={field.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/30 transition-colors">
              <Switch
                id={`field-${field.id}`}
                checked={form.form_config?.fields[field.id]?.enabled ?? true}
                onCheckedChange={(_, data) =>
                  onChange({
                    form_config: {
                      ...form.form_config!,
                      fields: { ...form.form_config!.fields, [field.id]: { enabled: data.checked } },
                    },
                  })
                }
              />
              <Label htmlFor={`field-${field.id}`} className="text-xs cursor-pointer flex-1">{field.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(() => emptyForm());

  type UiState = { isLoading: boolean; isSubmitting: boolean; isDialogOpen: boolean; editingCategory: Category | null };
  const [uiState, dispatchUi] = useReducer(
    (s: UiState, a: Partial<UiState>): UiState => ({ ...s, ...a }),
    { isLoading: true, isSubmitting: false, isDialogOpen: false, editingCategory: null }
  );
  const { isLoading, isSubmitting, isDialogOpen, editingCategory } = uiState;

  const fetchCategories = useCallback(async () => {
    dispatchUi({ isLoading: true });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await categoriesAPI.getAll()) as any;
      const data = Array.isArray(res) ? res : res?.data || [];
      setCategories(data.sort((a: Category, b: Category) => a.order - b.order));
    } catch {
      toast.error('Error al cargar categorías');
    } finally {
      dispatchUi({ isLoading: false });
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    dispatchUi({ editingCategory: null, isDialogOpen: true });
    setForm(emptyForm());
  };

  const openEdit = (cat: Category) => {
    dispatchUi({ editingCategory: cat, isDialogOpen: true });
    setForm({
      name: cat.name,
      display_name: cat.display_name,
      description: cat.description || '',
      is_active: cat.is_active,
      order: cat.order,
      image_url: cat.image_url || '',
      form_config: cat.form_config || {
        fields: FORM_FIELDS.reduce(
          (acc, field) => ({
            ...acc,
            [field.id]: { enabled: true },
          }),
          {}
        ),
      },
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.display_name.trim()) {
      toast.error('Nombre y nombre visible son obligatorios');
      return;
    }
    dispatchUi({ isSubmitting: true });
    try {
      const payload = {
        name: form.name.trim().toUpperCase().replace(/\s+/g, '_'),
        display_name: form.display_name.trim(),
        description: form.description?.trim() || undefined,
        is_active: form.is_active,
        order: Number(form.order) || 0,
        image_url: form.image_url?.trim() || undefined,
        form_config: form.form_config,
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, payload);
        toast.success('Categoría actualizada');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Categoría creada');
      }

      dispatchUi({ isDialogOpen: false });
      await fetchCategories();
    } catch {
      toast.error(editingCategory ? 'Error al actualizar' : 'Error al crear la categoría');
    } finally {
      dispatchUi({ isSubmitting: false });
    }
  };

  const handleToggle = async (cat: Category) => {
    try {
      await categoriesAPI.toggleActive(cat.id);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(`Categoría ${cat.is_active ? 'desactivada' : 'activada'}`);
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.display_name}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await categoriesAPI.delete(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success('Categoría eliminada');
    } catch {
      toast.error('Error al eliminar la categoría');
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Categorías"
        description="Administra las categorías de productos"
        action={
          <Button onClick={openCreate} size="sm">
            <Add24Regular className="mr-2 size-4" />
            Nueva Categoría
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }, (_, n) => n).map((n) => (
                <div key={`skel-cat-${n}`} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ToggleLeft24Regular className="size-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay categorías. Crea una nueva.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-semibold">Orden</th>
                    <th className="p-3 text-left font-semibold w-[60px]">Imagen</th>
                    <th className="p-3 text-left font-semibold">Código</th>
                    <th className="p-3 text-left font-semibold">Nombre visible</th>
                    <th className="p-3 text-left font-semibold">Descripción</th>
                    <th className="p-3 text-left font-semibold">Productos</th>
                    <th className="p-3 text-left font-semibold">Estado</th>
                    <th className="p-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground">{cat.order}</td>
                      <td className="p-3">
                        {cat.image_url ? (
                          <div className="size-8 rounded bg-muted overflow-hidden relative">
                            <Image
                              src={resolveImageUrl(cat.image_url)}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="size-8 rounded bg-muted flex items-center justify-center">
                            <Box24Regular className="size-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.name}</code>
                      </td>
                      <td className="p-3 font-medium">{cat.display_name}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                        {cat.description || '-'}
                      </td>
                      <td className="p-3">
                        {cat._count?.singles != null ? (
                          <Badge variant="secondary">{cat._count.singles}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={cat.is_active ? 'default' : 'outline'}
                          className={
                            cat.is_active
                              ? 'bg-green-100 text-green-800 border-none'
                              : 'text-muted-foreground'
                          }
                        >
                          {cat.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title={cat.is_active ? 'Desactivar' : 'Activar'}
                            onClick={() => handleToggle(cat)}
                          >
                            <ToggleLeft24Regular className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(cat)}
                          >
                            <Edit24Regular className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(cat)}
                          >
                            <Delete24Regular className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => dispatchUi({ isDialogOpen: data.open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nombre visible <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Cartas Individuales"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Código interno <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. SINGLES"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Se convierte automáticamente a mayúsculas y sin espacios.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                placeholder="Opcional"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Imagen (URL)</Label>
              <Input
                placeholder="https://... o ruta local"
                value={form.image_url || ''}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Orden de visualización</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={String(form.order)}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(_, data) => setForm((f) => ({ ...f, is_active: data.checked }))}
              />
              <Label htmlFor="is_active">Activa</Label>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Configuración de campos capturables</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Selecciona qué campos aparecerán en el formulario de registro para esta categoría.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FORM_FIELDS.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <Switch
                      id={`field-${field.id}`}
                      checked={form.form_config?.fields[field.id]?.enabled ?? true}
                      onCheckedChange={(_, data) =>
                        setForm((f) => ({
                          ...f,
                          form_config: {
                            ...f.form_config!,
                            fields: {
                              ...f.form_config!.fields,
                              [field.id]: { enabled: data.checked },
                            },
                          },
                        }))
                      }
                    />
                    <Label htmlFor={`field-${field.id}`} className="text-xs cursor-pointer flex-1">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => dispatchUi({ isDialogOpen: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <SpinnerIos20Regular className="mr-2 size-4 animate-spin" />}
              {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
