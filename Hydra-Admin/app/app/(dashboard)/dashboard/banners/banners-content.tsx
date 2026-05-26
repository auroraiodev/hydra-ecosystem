'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Add24Regular, Image24Regular } from '@fluentui/react-icons';
import { bannersAPI, tcgsAPI } from '@/lib/api';
import { stripProxyUrl } from '@/lib/utils/imageUrl';
import { toast } from 'sonner';
import { useModal } from '@/components/providers/modal-context';

import { BannerCard } from './components/BannerCard';
import { BannerFormDialog } from './components/BannerFormDialog';
import { type Banner, type Tcg, type FormState, emptyForm } from './types';

// ─── Reducer ─────────────────────────────────────────────────────────────────

interface State {
  banners: Banner[];
  tcgs: Tcg[];
  loading: boolean;
  isDialogOpen: boolean;
  editingBanner: Banner | null;
  form: FormState;
  isSubmitting: boolean;
}

type Action =
  | { type: 'SET_BANNERS'; payload: Banner[] }
  | { type: 'SET_TCGS'; payload: Tcg[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_EDITING_BANNER'; payload: Banner | null }
  | { type: 'SET_FORM'; payload: FormState }
  | { type: 'SET_SUBMITTING'; payload: boolean };

const initialState: State = {
  banners: [], tcgs: [], loading: true, isDialogOpen: false,
  editingBanner: null, form: emptyForm(), isSubmitting: false,
};

function bannersReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_BANNERS': return { ...state, banners: action.payload };
    case 'SET_TCGS': return { ...state, tcgs: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_DIALOG_OPEN': return { ...state, isDialogOpen: action.payload };
    case 'SET_EDITING_BANNER': return { ...state, editingBanner: action.payload };
    case 'SET_FORM': return { ...state, form: action.payload };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.payload };
    default: return state;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BannersContent() {
  const [state, dispatch] = useReducer(bannersReducer, initialState);
  const { showConfirm } = useModal();
  const { banners, tcgs, loading, isDialogOpen, editingBanner, form, isSubmitting } = state;

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [bannersRes, tcgsRes] = await Promise.all([bannersAPI.list(), tcgsAPI.list()]);
      dispatch({ type: 'SET_BANNERS', payload: bannersRes.data || bannersRes || [] });
      dispatch({ type: 'SET_TCGS', payload: tcgsRes.data || tcgsRes || [] });
    } catch {
      toast.error('Failed to load data');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenDialog = (banner: Banner | null = null) => {
    if (banner) {
      dispatch({ type: 'SET_EDITING_BANNER', payload: banner });
      dispatch({
        type: 'SET_FORM',
        payload: {
          title: banner.title || '', subtitle: banner.subtitle || '', description: banner.description || '',
          desktop_image: banner.desktop_image || '', mobile_image: banner.mobile_image || '',
          button_text: banner.button_text || '', button_link: banner.button_link || '',
          is_active: banner.is_active, order: banner.order || 0, tcg_id: banner.tcg_id || 'none',
        },
      });
    } else {
      dispatch({ type: 'SET_EDITING_BANNER', payload: null });
      dispatch({ type: 'SET_FORM', payload: emptyForm() });
    }
    dispatch({ type: 'SET_DIALOG_OPEN', payload: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dispatch({ type: 'SET_SUBMITTING', payload: true });
      const payload = {
        ...form,
        desktop_image: stripProxyUrl(form.desktop_image),
        mobile_image: stripProxyUrl(form.mobile_image),
        tcg_id: form.tcg_id === 'none' ? null : form.tcg_id,
        order: Number(form.order),
      };

      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, payload);
        toast.success('Banner updated successfully');
      } else {
        await bannersAPI.create(payload);
        toast.success('Banner created successfully');
      }

      dispatch({ type: 'SET_DIALOG_OPEN', payload: false });
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save banner');
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: 'Delete Banner',
      message: 'Are you sure you want to delete this banner?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await bannersAPI.delete(id);
          toast.success('Banner deleted successfully');
          fetchData();
        } catch (error) {
          console.error('Failed to delete banner:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to delete banner');
        }
      },
    });
  };

  const toggleStatus = async (banner: Banner) => {
    try {
      await bannersAPI.update(banner.id, { is_active: !banner.is_active });
      toast.success(`Banner ${banner.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const bannersByTcg = banners.reduce((acc, banner) => {
    const tcgId = banner.tcg_id || 'global';
    if (!acc[tcgId]) acc[tcgId] = [];
    acc[tcgId].push(banner);
    return acc;
  }, {} as Record<string, Banner[]>);

  const tcgList = [{ id: 'global', display_name: 'Global / General' }, ...tcgs];

  return (
    <PageLayout>
      <PageHeader
        title="Banners"
        description="Manage marketing banners grouped by supracategory (TCG)"
        action={
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Add24Regular className="size-4" />
            Add Banner
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {['sk1', 'sk2', 'sk3'].map((id) => <Skeleton key={id} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Image24Regular className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No banners found</h3>
            <p className="text-muted-foreground mb-6">Create your first banner to show on the homepage.</p>
            <Button onClick={() => handleOpenDialog()} variant="outline">Create Banner</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {tcgList.map((tcg) => {
            const tcgBanners = bannersByTcg[tcg.id] || [];
            if (tcgBanners.length === 0) return null;

            return (
              <div key={tcg.id} className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-xl font-semibold uppercase tracking-tight">{tcg.display_name}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {tcgBanners.length} {tcgBanners.length === 1 ? 'Banner' : 'Banners'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {tcgBanners.sort((a, b) => a.order - b.order).map((banner) => (
                    <BannerCard
                      key={banner.id}
                      banner={banner}
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BannerFormDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open })}
        editingBannerId={editingBanner?.id}
        form={form}
        onFormChange={(f) => dispatch({ type: 'SET_FORM', payload: f })}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        tcgs={tcgs}
      />
    </PageLayout>
  );
}
