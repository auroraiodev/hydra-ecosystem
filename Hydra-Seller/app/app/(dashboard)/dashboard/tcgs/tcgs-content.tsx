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
  ArrowSync24Regular,
  Games24Regular,
  ReOrder24Regular,
} from '@fluentui/react-icons';
import { tcgsAPI } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { toast } from 'sonner';

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Tcg {
  id: string;
  name: string;
  display_name: string;
  logo_url?: string;
  icon_url?: string;
  is_active: boolean;
  order: number;
  created_at?: string;
  _count?: { singles: number };
}

const emptyForm = () => ({
  name: '',
  display_name: '',
  logo_url: '',
  icon_url: '',
  is_active: true,
  order: 0,
});

const ACCENT_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-green-100 text-green-800',
  'bg-pink-100 text-pink-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
];

// --- Sortable Card Component ---
function SortableTcgCard({
  tcg,
  idx,
  onEdit,
  onToggle,
  onDelete,
}: {
  tcg: Tcg;
  idx: number;
  onEdit: (t: Tcg) => void;
  onToggle: (t: Tcg) => void;
  onDelete: (t: Tcg) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tcg.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`relative overflow-hidden border h-full flex flex-col ${!tcg.is_active ? 'opacity-60' : ''} ${isDragging ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : ''}`}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${ACCENT_COLORS[idx % ACCENT_COLORS.length].split(' ')[0]}`}
        />
        <CardContent className="pt-5 pb-4 px-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-center gap-3">
              {/* Drag Handle */}
              <button
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                {...attributes}
                {...listeners}
              >
                <ReOrder24Regular className="size-4" />
              </button>

              {tcg.icon_url && (
                <div className="size-10 rounded border bg-muted shrink-0 overflow-hidden relative flex items-center justify-center">
                  <Image
                    src={resolveImageUrl(tcg.icon_url)}
                    alt={tcg.display_name}
                    width={40}
                    height={40}
                    className="object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-base truncate">{tcg.display_name}</p>
                <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  {tcg.name}
                </code>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge
                variant={tcg.is_active ? 'default' : 'outline'}
                className={
                  tcg.is_active
                    ? 'bg-green-100 text-green-800 border-none'
                    : 'text-muted-foreground'
                }
              >
                {tcg.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              <div className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border flex items-center gap-1">
                POS: <span className="text-foreground">{tcg.order}</span>
              </div>
            </div>
          </div>

          {tcg._count?.singles != null && (
            <p className="text-xs text-muted-foreground mt-3">
              <span className="font-medium text-foreground">{tcg._count.singles}</span> producto
              {tcg._count.singles !== 1 ? 's' : ''}
            </p>
          )}

          <div className="flex items-center gap-1 mt-auto pt-3 border-t">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onToggle(tcg)}>
              {tcg.is_active ? 'Desactivar' : 'Activar'}
            </Button>

            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(tcg)}>
                <Edit24Regular className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(tcg)}
              >
                <Delete24Regular className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TcgsContent() {
  const [tcgs, setTcgs] = useState<Tcg[]>([]);
  const [form, setForm] = useState(() => emptyForm());

  type UiState = { isLoading: boolean; isSubmitting: boolean; isDialogOpen: boolean; editingTcg: Tcg | null };
  const [uiState, dispatchUi] = useReducer(
    (s: UiState, a: Partial<UiState>): UiState => ({ ...s, ...a }),
    { isLoading: true, isSubmitting: false, isDialogOpen: false, editingTcg: null }
  );
  const { isLoading, isSubmitting, isDialogOpen, editingTcg } = uiState;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTcgs = useCallback(async () => {
    dispatchUi({ isLoading: true });
    try {
      const res = await tcgsAPI.list();
      const data = Array.isArray(res) ? res : res?.data || [];
      // Ordenar por 'order' explícitamente para asegurar consistencia en UI
      const sortedData = data.toSorted((a: Tcg, b: Tcg) => (a.order || 0) - (b.order || 0));
      setTcgs(sortedData);
    } catch {
      toast.error('Error al cargar TCGs');
    } finally {
      dispatchUi({ isLoading: false });
    }
  }, []);

  useEffect(() => {
    void fetchTcgs();
  }, [fetchTcgs]);

  const openCreate = () => {
    dispatchUi({ editingTcg: null, isDialogOpen: true });
    setForm(emptyForm());
  };

  const openEdit = (tcg: Tcg) => {
    dispatchUi({ editingTcg: tcg, isDialogOpen: true });
    setForm({
      name: tcg.name,
      display_name: tcg.display_name,
      logo_url: resolveImageUrl(tcg.logo_url) || '',
      icon_url: resolveImageUrl(tcg.icon_url) || '',
      is_active: tcg.is_active,
      order: tcg.order || 0,
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.display_name.trim()) {
      toast.error('Código y nombre visible son obligatorios');
      return;
    }
    dispatchUi({ isSubmitting: true });
    try {
      const payload = {
        name: form.name.trim().toUpperCase().replace(/\s+/g, '_'),
        display_name: form.display_name.trim(),
        logo_url: form.logo_url.trim() || null,
        icon_url: form.icon_url.trim() || null,
        is_active: form.is_active,
        order: Number(form.order) || 0,
      };

      if (editingTcg) {
        await tcgsAPI.update(editingTcg.id, payload);
        toast.success('Supracategoría actualizada');
      } else {
        await tcgsAPI.create(payload);
        toast.success('Supracategoría creada exitosamente');
      }

      dispatchUi({ isDialogOpen: false });
      await fetchTcgs();
    } catch {
      toast.error(
        editingTcg ? 'Error al actualizar la Supracategoría' : 'Error al crear la Supracategoría'
      );
    } finally {
      dispatchUi({ isSubmitting: false });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTcgs((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Actualizar los valores de 'order' localmente y disparar actualizaciones al backend
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index,
        }));

        // Guardar cambios en el backend de forma asíncrona (Optimistic update)
        void saveBatchOrder(updatedItems);

        return updatedItems;
      });
    }
  };

  const saveBatchOrder = async (items: Tcg[]) => {
    try {
      // Mandar actualizaciones en paralelo o secuencia
      // Nota: Si hay muchos TCGs, lo ideal es un endpoint de batch,
      // pero aquí son pocos así que actualizamos uno por uno o solo los cambiados.
      const promises = items.map((item) => tcgsAPI.update(item.id, { order: item.order }));
      await Promise.all(promises);
      toast.success('Orden guardado');
    } catch {
      toast.error('Error al guardar el nuevo orden');
      void fetchTcgs(); // Revertir si falla
    }
  };

  const handleToggle = async (tcg: Tcg) => {
    try {
      await tcgsAPI.update(tcg.id, { is_active: !tcg.is_active });
      setTcgs((prev) => prev.map((t) => (t.id === tcg.id ? { ...t, is_active: !t.is_active } : t)));
      toast.success(`TCG ${tcg.is_active ? 'desactivado' : 'activado'}`);
    } catch {
      toast.error('Error al cambiar estado del TCG');
    }
  };

  const handleDelete = async (tcg: Tcg) => {
    if (
      !confirm(
        `¿Eliminar la Supracategoría "${tcg.display_name}"?\n\nSolo es posible si no tiene productos asociados.`
      )
    )
      return;
    try {
      await tcgsAPI.delete(tcg.id);
      setTcgs((prev) => prev.filter((t) => t.id !== tcg.id));
      toast.success('Supracategoría eliminada');
    } catch {
      toast.error('No se puede eliminar — la Supracategoría tiene productos asociados');
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'icon_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('La imagen es demasiado grande (máx 1MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Supracategorías"
        description="Arrastra las tarjetas para cambiar su orden de aparición"
        action={
          <Button onClick={openCreate} size="sm">
            <Add24Regular className="mr-2 size-4" />
            Nueva Supracategoría
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }, (_, n) => n).map((n) => (
            <Card key={`skel-tcg-${n}`}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tcgs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Games24Regular className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay Supracategorías registradas. Crea la primera.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tcgs.map((t) => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tcgs.map((tcg, idx) => (
                <SortableTcgCard
                  key={tcg.id}
                  tcg={tcg}
                  idx={idx}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => dispatchUi({ isDialogOpen: data.open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingTcg ? 'Editar Supracategoría' : 'Nueva Supracategoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nombre visible <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Magic: The Gathering"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Código interno <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. MTG"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Mayúsculas sin espacios. Se usa internamente para filtros.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Logo completo</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://… o sube un archivo"
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => document.getElementById('logo_file')?.click()}
                >
                  <Add24Regular className="size-4" />
                </Button>
                <input
                  id="logo_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'logo_url')}
                />
              </div>
              {form.logo_url && (
                <div className="mt-2 h-16 w-full rounded border bg-muted flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={resolveImageUrl(form.logo_url)}
                    alt="Logo preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Icono / Logo pequeño</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://… o sube un archivo"
                  value={form.icon_url}
                  onChange={(e) => setForm((f) => ({ ...f, icon_url: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => document.getElementById('icon_file')?.click()}
                >
                  <Add24Regular className="size-4" />
                </Button>
                <input
                  id="icon_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'icon_url')}
                />
              </div>
              {form.icon_url && (
                <div className="mt-2 size-10 rounded border bg-muted flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={resolveImageUrl(form.icon_url)}
                    alt="Icon preview"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="tcg_active"
                checked={form.is_active}
                onChange={(_, data) => setForm((f) => ({ ...f, is_active: data.checked }))}
              />
              <Label htmlFor="tcg_active">Activo</Label>
            </div>

            <div className="space-y-1.5">
              <Label>Orden de aparición</Label>
              <Input
                type="number"
                placeholder="0"
                value={String(form.order)}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Menor número aparece primero (ej. 0, 1, 2).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => dispatchUi({ isDialogOpen: false })}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <ArrowSync24Regular className="mr-2 size-4 animate-spin" />}
              {editingTcg ? 'Guardar cambios' : 'Crear Supracategoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
