'use client';

import { useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Info } from 'lucide-react';
import { useAuth } from '@/features/auth';
import {
  MobilePageContainer,
  DesktopPageContainer,
} from '@/features/shared/components/PageContainers';
import { getMyListings, type Listing } from '@/lib/api/listings';
import { FlowButton } from '@/features/shared/ui/flow-button';
import Image from 'next/image';

interface ListingsState {
  listings: Listing[];
  totalPages: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

type ListingsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { data: Listing[]; totalPages: number } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_PAGE'; payload: number };

function listingsReducer(state: ListingsState, action: ListingsAction): ListingsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        listings: action.payload.data,
        totalPages: action.payload.totalPages,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    default:
      return state;
  }
}

function statusLabel(status: Listing['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'ACTIVO';
    case 'SOLD':
      return 'VENDIDO';
    case 'IN_TRANSIT':
      return 'EN CAMINO';
    case 'IN_MEXICO':
      return 'EN MÉXICO';
    case 'UNLISTED':
      return 'NO PUBLICADO';
    default:
      return 'RETIRADA';
  }
}

function statusClasses(status: Listing['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/15 text-green-400';
    case 'SOLD':
      return 'bg-blue-500/15 text-blue-400';
    case 'IN_TRANSIT':
      return 'bg-orange-500/15 text-orange-400';
    case 'IN_MEXICO':
      return 'bg-yellow-500/15 text-yellow-400';
    case 'UNLISTED':
      return 'bg-surface-high text-text-muted border border-border-subtle';
    default:
      return 'bg-surface-high text-text-muted';
  }
}

function ListingCardMobile({ listing }: { listing: Listing }) {
  return (
    <div className="glass-panel rounded-2xl border border-border-subtle p-4 flex gap-4 overflow-hidden">
      <div className="relative size-20 shrink-0 bg-surface-low rounded-xl overflow-hidden">
        <Image
          src={listing.singles.img ?? ''}
          alt={listing.singles.cardName || listing.singles.name || 'Listing image'}
          fill
          sizes="80px"
          className="object-contain"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-text-body text-sm line-clamp-1">
            {listing.singles.cardName || listing.singles.name}
          </h3>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] bg-surface-high text-text-muted px-2 py-0.5 rounded-full font-medium">
              {listing.singles.expansion || 'General'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusClasses(listing.status)}`}
            >
              {statusLabel(listing.status)}
            </span>
            {listing.singles?.stock !== undefined && (
              <div className="flex items-center gap-1.5 bg-accent-glow/20 text-teal-400 px-2 py-0.5 rounded-md border border-teal-500/30">
                <Package className="size-3.5" />
                <span className="text-[10px] font-bold uppercase">
                  {listing.singles.stock} EN STOCK
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-medium">Precio Venta</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-bold ${listing.singles.conditions?.discount ? 'text-text-muted line-through text-[11px]' : 'text-text-body'}`}
              >
                ${Number(listing.singles.price).toFixed(2)}
              </span>
              {listing.singles.conditions?.discount && (
                <span className="text-sm font-bold text-text-body">
                  $
                  {(
                    Number(listing.singles.price) *
                    (1 - listing.singles.conditions.discount / 100)
                  ).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-primary font-bold uppercase tracking-tight">
              Tu vas a ganar
            </span>
            <span className="text-lg font-black text-primary">${listing.earnings?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingCardDesktop({ listing }: { listing: Listing }) {
  return (
    <div className="py-6 flex items-center gap-6 first:pt-0 last:pb-0 group">
      <div className="relative size-24 bg-surface-low rounded-2xl overflow-hidden ring-1 ring-border-subtle group-hover:ring-primary/20 transition-all">
        <Image
          src={listing.singles.img ?? ''}
          alt={listing.singles.cardName || listing.singles.name || 'Listing image'}
          fill
          sizes="96px"
          className="object-contain p-2"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-body group-hover:text-primary transition-colors">
              {listing.singles.cardName || listing.singles.name}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              {listing.singles.expansion} • {listing.singles.variant || 'Standard'} •{' '}
              {listing.singles.surgeFoil
                ? 'Surge Foil'
                : listing.singles.foil
                  ? 'Foil'
                  : 'Non-Foil'}
            </p>
          </div>
          <span
            className={`text-[11px] px-3 py-1 rounded-full font-black tracking-widest ${statusClasses(listing.status)}`}
          >
            {statusLabel(listing.status)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">Estado</span>
              <span className="text-sm font-medium text-text-body">
                {listing.singles.conditions?.display_name || 'NM'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">Precio</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${listing.singles.conditions?.discount ? 'text-text-muted line-through text-xs' : 'text-text-body'}`}
                >
                  ${Number(listing.singles.price).toFixed(2)}
                </span>
                {listing.singles.conditions?.discount && (
                  <span className="text-sm font-bold text-text-body">
                    $
                    {(
                      Number(listing.singles.price) *
                      (1 - listing.singles.conditions.discount / 100)
                    ).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">Stock</span>
              <span className="text-sm font-black text-text-body">
                {listing.singles.stock ?? 0}
              </span>
            </div>
          </div>
          <div className="bg-primary/5 px-6 py-2 rounded-2xl border border-primary/10 flex flex-col items-end">
            <span className="text-[10px] text-primary font-black uppercase tracking-widest">
              Tu ganancia neta
            </span>
            <span className="text-2xl font-black text-primary leading-tight">
              ${listing.earnings?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-8 pb-10">
      <FlowButton
        variant="ghost"
        simple
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-xl bg-surface-low border border-border-subtle disabled:opacity-30"
      >
        <ArrowLeft className="size-5" />
      </FlowButton>
      <span className="text-sm font-bold text-text-body">
        Página {currentPage} de {totalPages}
      </span>
      <FlowButton
        variant="ghost"
        simple
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-xl bg-surface-low border border-border-subtle disabled:opacity-30 rotate-180"
      >
        <ArrowLeft className="size-5" />
      </FlowButton>
    </div>
  );
}

function DesktopPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-12">
      <FlowButton
        variant="ghost"
        simple
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-4 py-2 rounded-xl bg-surface-low border border-border-subtle disabled:opacity-30 flex items-center gap-2"
      >
        <ArrowLeft className="size-4" />
        Anterior
      </FlowButton>
      <span className="text-sm font-bold text-text-body px-4 py-2 bg-surface-low rounded-xl border border-border-subtle">
        {currentPage} / {totalPages}
      </span>
      <FlowButton
        variant="ghost"
        simple
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-4 py-2 rounded-xl bg-surface-low border border-border-subtle disabled:opacity-30 flex items-center gap-2"
      >
        Siguiente
        <ArrowLeft className="size-4 rotate-180" />
      </FlowButton>
    </div>
  );
}

export default function MyListingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { push, back } = useRouter();

  const [state, dispatch] = useReducer(listingsReducer, {
    listings: [],
    totalPages: 1,
    loading: true,
    error: null,
    currentPage: 1,
  });

  const { listings, totalPages, loading, error, currentPage } = state;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      push('/login');
    }
  }, [isAuthenticated, authLoading, push]);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      try {
        dispatch({ type: 'FETCH_START' });
        const result = await getMyListings(currentPage, 12);
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: { data: result.data, totalPages: result.totalPages },
        });
      } catch (err) {
        console.error('Failed to fetch listings', err);
        dispatch({ type: 'FETCH_ERROR', payload: 'No se pudieron cargar tus artículos.' });
      }
    }
    fetchData();
  }, [isAuthenticated, currentPage]);

  if (authLoading || (!isAuthenticated && !authLoading)) return null;

  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  };

  return (
    <>
      <MobilePageContainer>
        <div className="px-4 pt-4 flex items-center gap-3">
          <FlowButton
            variant="ghost"
            simple
            onClick={() => back()}
            className="p-2 rounded-full transition-colors size-auto border-0"
          >
            <ArrowLeft className="text-xl text-text-muted" />
          </FlowButton>
          <h1 className="text-xl font-semibold text-text-body">Mis Artículos</h1>
        </div>
        <div className="px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 glass-panel rounded-2xl">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-dashed border-border-subtle">
              <div className="bg-surface-high size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="text-3xl text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-body mb-1">Sin artículos</h3>
              <p className="text-text-muted text-sm px-8">
                No tienes artículos publicados para la venta en este momento.
              </p>
            </div>
          ) : (
            <div className="gap-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 mb-6">
                <Info className="text-blue-400 text-xl shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300 leading-relaxed">
                  Hydra Collectables cobra una comisión del {listings[0]?.commission_rate || 12}%
                  por cada venta realizada. Los ingresos mostrados ya reflejan este descuento.
                </p>
              </div>
              {listings.map((listing) => (
                <ListingCardMobile key={listing.id} listing={listing} />
              ))}
              <ListingsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </MobilePageContainer>

      <DesktopPageContainer>
        <div className="max-w-4xl mx-auto py-10 px-6">
          <div className="flex items-center gap-4 mb-8">
            <FlowButton
              variant="ghost"
              simple
              onClick={() => back()}
              className="p-2 rounded-full transition-colors size-auto border-0 focus:ring-0"
            >
              <ArrowLeft className="text-2xl text-text-muted" />
            </FlowButton>
            <div>
              <h1 className="text-3xl font-semibold text-text-body">Mis Artículos</h1>
              <p className="text-text-muted">
                Gestiona tus productos y visualiza tus posibles ganancias.
              </p>
            </div>
          </div>
          <div className="glass-panel rounded-3xl border border-border-subtle overflow-hidden">
            <div className="bg-surface-low border-b border-border-subtle px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="text-text-muted" />
                <span className="text-sm font-bold text-text-muted uppercase tracking-wider">
                  Inventario
                </span>
              </div>
              <div className="text-xs font-medium text-text-muted bg-surface px-3 py-1 rounded-full border border-border-subtle">
                Comisión: {listings[0]?.commission_rate || 12}%
              </div>
            </div>
            <div className="p-8">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-400">{error}</div>
              ) : listings.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="text-6xl text-text-muted/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-body">No hay nada por aquí</h3>
                  <p className="text-text-muted mt-2">
                    Todavía no has publicado ningún artículo para la venta.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {listings.map((listing) => (
                    <ListingCardDesktop key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
              <DesktopPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </DesktopPageContainer>
    </>
  );
}
