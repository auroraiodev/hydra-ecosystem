'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import {
  Add24Regular,
  Games24Regular,
} from '@fluentui/react-icons';
import { tcgsAPI } from '@/lib/api';
import { stripProxyUrl } from '@/lib/utils/imageUrl';
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
} from '@dnd-kit/sortable';

import { SortableTcgCard } from './components/SortableTcgCard';
import { TcgFormDialog } from './components/TcgFormDialog';
import { TcgDeleteDialog } from './components/TcgDeleteDialog';
import { type Tcg, emptyForm } from './types';

interface DialogState {
  isOpen: boolean;
  isSubmitting: boolean;
  editingTcg: Tcg | null;
  form: ReturnType<typeof emptyForm>;
}

type DialogAction =
  | { type: 'OPEN_CREATE' }
  | { type: 'OPEN_EDIT'; tcg: Tcg }
  | { type: 'CLOSE' }
  | { type: 'SET_FORM'; form: Partial<ReturnType<typeof emptyForm>> }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean };

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'OPEN_CREATE':
      return { isOpen: true, isSubmitting: false, editingTcg: null, form: emptyForm() };
    case 'OPEN_EDIT':
      return {
        isOpen: true,
        isSubmitting: false,
        editingTcg: action.tcg,
        form: {
          name: action.tcg.name,
          display_name: action.tcg.display_name,
          logo_url: action.tcg.logo_url || '',
          icon_url: action.tcg.icon_url || '',
          loader_url: action.tcg.loader_url || '',
          is_active: action.tcg.is_active,
          order: action.tcg.order || 0,
        },
      };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'SET_FORM':
      return { ...state, form: { ...state.form, ...action.form } };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    default:
      return state;
  }
}

type TcgsState = {
  tcgs: Tcg[];
  isLoading: boolean;
  deletingTcg: Tcg | null;
  deleteConfirmText: string;
  isDeleting: boolean;
};

const initialTcgsState: TcgsState = {
  tcgs: [],
  isLoading: true,
  deletingTcg: null,
  deleteConfirmText: '',
  isDeleting: false,
};

type TcgsAction =
  | { type: 'SET_TCGS'; tcgs: Tcg[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_DELETING_TCG'; deletingTcg: Tcg | null }
  | { type: 'SET_DELETE_CONFIRM_TEXT'; deleteConfirmText: string }
  | { type: 'SET_IS_DELETING'; isDeleting: boolean };

function tcgsReducer(state: TcgsState, action: TcgsAction): TcgsState {
  switch (action.type) {
    case 'SET_TCGS':
      return { ...state, tcgs: action.tcgs };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_DELETING_TCG':
      return { ...state, deletingTcg: action.deletingTcg };
    case 'SET_DELETE_CONFIRM_TEXT':
      return { ...state, deleteConfirmText: action.deleteConfirmText };
    case 'SET_IS_DELETING':
      return { ...state, isDeleting: action.isDeleting };
    default:
      return state;
  }
}

export default function TcgsContent() {
  const [{ tcgs, isLoading, deletingTcg, deleteConfirmText, isDeleting }, dispatch] = useReducer(
    tcgsReducer,
    initialTcgsState
  );
  const [dialog, dispatchDialog] = useReducer(dialogReducer, {
    isOpen: false,
    isSubmitting: false,
    editingTcg: null,
    form: emptyForm(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTcgs = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const res = await tcgsAPI.list();
      const data = Array.isArray(res) ? res : res?.data || [];
      const sortedData = data.toSorted((a: Tcg, b: Tcg) => (a.order || 0) - (b.order || 0));
      dispatch({ type: 'SET_TCGS', tcgs: sortedData });
    } catch {
      toast.error('Error al cargar TCGs');
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);

  useEffect(() => {
    void fetchTcgs();
  }, [fetchTcgs]);

  const openCreate = () => {
    dispatchDialog({ type: 'OPEN_CREATE' });
  };

  const openEdit = (tcg: Tcg) => {
    dispatchDialog({ type: 'OPEN_EDIT', tcg });
  };

  const handleSubmit = async () => {
    if (!dialog.form.name.trim() || !dialog.form.display_name.trim()) {
      toast.error('Código y nombre visible son obligatorios');
      return;
    }
    dispatchDialog({ type: 'SET_SUBMITTING', isSubmitting: true });
    try {
      const payload = {
        name: dialog.form.name.trim().toUpperCase().replace(/\s+/g, '_'),
        display_name: dialog.form.display_name.trim(),
        logo_url: stripProxyUrl(dialog.form.logo_url.trim()) || null,
        icon_url: stripProxyUrl(dialog.form.icon_url.trim()) || null,
        loader_url: dialog.form.loader_url.trim() || null,
        is_active: dialog.form.is_active,
        order: Number(dialog.form.order) || 0,
      };

      if (dialog.editingTcg) {
        await tcgsAPI.update(dialog.editingTcg.id, payload);
        toast.success('Supracategoría actualizada');
      } else {
        await tcgsAPI.create(payload);
        toast.success('Supracategoría creada exitosamente');
      }

      dispatchDialog({ type: 'CLOSE' });
      await fetchTcgs();
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      if (apiError?.status === 409) {
        toast.error('Ya existe una Supracategoría con ese código interno');
      } else {
        toast.error(
          dialog.editingTcg
            ? 'Error al actualizar la Supracategoría'
            : 'Error al crear la Supracategoría'
        );
      }
    } finally {
      dispatchDialog({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tcgs.findIndex((i) => i.id === active.id);
      const newIndex = tcgs.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(tcgs, oldIndex, newIndex);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      void saveBatchOrder(updatedItems);
      dispatch({ type: 'SET_TCGS', tcgs: updatedItems });
    }
  };

  const saveBatchOrder = async (items: Tcg[]) => {
    try {
      const promises = items.map((item) => tcgsAPI.update(item.id, { order: item.order }));
      await Promise.all(promises);
      toast.success('Orden guardado');
    } catch {
      toast.error('Error al guardar el nuevo orden');
      void fetchTcgs();
    }
  };

  const handleToggle = async (tcg: Tcg) => {
    try {
      await tcgsAPI.update(tcg.id, { is_active: !tcg.is_active });
      dispatch({
        type: 'SET_TCGS',
        tcgs: tcgs.map((t) => (t.id === tcg.id ? { ...t, is_active: !t.is_active } : t)),
      });
      toast.success(`TCG ${tcg.is_active ? 'desactivado' : 'activado'}`);
    } catch {
      toast.error('Error al cambiar estado del TCG');
    }
  };

  const handleDelete = (tcg: Tcg) => {
    dispatch({ type: 'SET_DELETING_TCG', deletingTcg: tcg });
    dispatch({ type: 'SET_DELETE_CONFIRM_TEXT', deleteConfirmText: '' });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTcg) return;
    dispatch({ type: 'SET_IS_DELETING', isDeleting: true });
    try {
      await tcgsAPI.delete(deletingTcg.id);
      dispatch({ type: 'SET_TCGS', tcgs: tcgs.filter((t) => t.id !== deletingTcg.id) });
      toast.success('Supracategoría y sus datos eliminados');
      dispatch({ type: 'SET_DELETING_TCG', deletingTcg: null });
    } catch {
      toast.error('Error al eliminar la Supracategoría');
    } finally {
      dispatch({ type: 'SET_IS_DELETING', isDeleting: false });
    }
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
          {['sk1', 'sk2', 'sk3', 'sk4'].map((k) => (
            <Card key={k}>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
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

      <TcgDeleteDialog
        tcg={deletingTcg}
        onClose={() => dispatch({ type: 'SET_DELETING_TCG', deletingTcg: null })}
        confirmText={deleteConfirmText}
        onConfirmTextChange={(text) => dispatch({ type: 'SET_DELETE_CONFIRM_TEXT', deleteConfirmText: text })}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      <TcgFormDialog
        isOpen={dialog.isOpen}
        onClose={() => dispatchDialog({ type: 'CLOSE' })}
        editingTcg={dialog.editingTcg}
        form={dialog.form}
        onFormChange={(form) => dispatchDialog({ type: 'SET_FORM', form })}
        isSubmitting={dialog.isSubmitting}
        onSubmit={handleSubmit}
      />
    </PageLayout>
  );
}
