'use client';

import Link from 'next/link';
import {
  Edit2,
  Camera,
  ShoppingBag,
  Shirt,
  Wallet,
  User,
  MapPin,
  CreditCard,
  Package,
  Settings,
  LogOut,
  ChevronRight,
  Share2,
  Archive,
  Heart,
  Banknote,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { MobilePageContainer } from '@/features/shared/components/PageContainers';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { fixEncoding } from '@/lib/utils/encoding';
import { getCollectorLevel } from '../utils';
import { useProfileStats } from '../hooks/useProfileStats';
import { type ProfileMobileViewProps } from '../types';

export function ProfileMobileView({ onEditProfile }: ProfileMobileViewProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const stats = useProfileStats(isAuthenticated);

  const firstName = user?.first_name ? fixEncoding(user.first_name) : '';
  const lastName = user?.last_name ? fixEncoding(user.last_name) : '';
  const displayName = isAuthenticated && user ? `${firstName} ${lastName}`.trim() || 'Usuario' : '';
  const username = user?.username || '';
  const avatarUrl = user?.avatar_url || null;
  const userInitials =
    isAuthenticated && user
      ? `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
      : 'U';

  const collectorLevel = getCollectorLevel(stats.ordersCount ?? 0);

  return (
    <MobilePageContainer>
      <div className="sticky top-0 z-20 bg-vault-bg/95 backdrop-blur-xl border-b border-vault-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <User className="size-5 text-teal" />
            </div>
            <h1 className="text-lg font-semibold text-vault-text">Mi Perfil</h1>
          </div>
          <FlowButton
            variant="ghost"
            simple
            onClick={logout}
            className="text-red-500 text-xs font-semibold flex items-center gap-1.5 p-0 h-auto border-0 hover:bg-transparent"
          >
            <LogOut className="size-4" />
            Salir
          </FlowButton>
        </div>
      </div>

      <div className="flex flex-col items-center pt-6 pb-8 px-4">
        <div className="relative group cursor-pointer">
          {isLoading ? (
            <Skeleton className="size-28 rounded-full shadow-xl" />
          ) : avatarUrl ? (
            <div
              className="bg-center bg-cover rounded-full size-28 shadow-xl ring-1"
              style={{ backgroundImage: `url("${avatarUrl}")` }}
            />
          ) : (
            <div className="bg-primary text-white rounded-full size-28 shadow-xl flex items-center justify-center text-3xl font-bold">
              {userInitials}
            </div>
          )}
          {!isLoading && (
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 flex items-center justify-center shadow-md">
              <Camera className="text-[16px]" />
            </div>
          )}
        </div>
        <div className="mt-4 text-center">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto mb-3" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-text-body">{displayName}</h1>
              <p className="text-secondary-text font-medium text-sm mt-1">
                {username.startsWith('@') ? username : `@${username}`}
              </p>
              {user?.phone && (
                <p className="text-secondary-text font-medium text-sm mt-1">{user.phone}</p>
              )}
              <div
                className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${collectorLevel.current.bg} ${collectorLevel.current.color}`}
              >
                <span>{collectorLevel.current.icon}</span>
                {collectorLevel.current.label}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href="/profile/orders"
            className="flex-1 min-w-[100px] flex flex-col gap-1 rounded-2xl p-4 glass-panel ghost-border"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-primary text-[20px]" />
              <p className="text-xs font-bold uppercase text-secondary-text tracking-wider">
                Pedidos
              </p>
            </div>
            <div className="text-2xl font-extrabold text-text-body">
              {stats.isLoadingOrders ? <Skeleton className="size-8" /> : (stats.ordersCount ?? 0)}
            </div>
          </Link>
          <Link
            href="/profile/listings"
            className="flex-1 min-w-[100px] flex flex-col gap-1 rounded-2xl p-4 glass-panel ghost-border"
          >
            <div className="flex items-center gap-2">
              <Shirt className="text-primary text-[20px]" />
              <p className="text-xs font-bold uppercase text-secondary-text tracking-wider">
                En Venta
              </p>
            </div>
            <div className="text-2xl font-extrabold text-text-body">
              {stats.isLoadingListings ? (
                <Skeleton className="size-8" />
              ) : (
                (stats.listingsCount ?? 0)
              )}
            </div>
          </Link>
          <Link
            href="/profile/balance"
            className="flex-1 min-w-[120px] flex flex-col gap-1 rounded-2xl p-4 glass-panel ghost-border"
          >
            <div className="flex items-center gap-2">
              <Wallet className="text-primary text-[20px]" />
              <p className="text-xs font-bold uppercase text-secondary-text tracking-wider">
                Balance
              </p>
            </div>
            <div className="text-2xl font-extrabold text-text-body">
              {stats.isLoadingBalance ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `$${stats.balance?.toLocaleString() || 0}`
              )}
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 mb-8 flex gap-3">
        <FlowButton onClick={onEditProfile} variant="outline" size="sm" className="flex-1">
          <span className="flex items-center gap-2">
            <Edit2 className="text-xl" />
            Editar Perfil
          </span>
        </FlowButton>
        <FlowButton variant="outline" size="sm" className="flex-1">
          <span className="flex items-center gap-2">
            <Share2 className="text-xl" />
            Compartir
          </span>
        </FlowButton>
      </div>

      <div className="px-4 gap-y-6">
        <div className="mb-8">
          <h2 className="px-6 pb-3 text-sm font-semibold text-text-muted uppercase tracking-wider">
            Cuenta
          </h2>
          <div className="glass-panel ghost-border mx-4 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={onEditProfile}
              className="w-full flex items-center gap-4 p-4 active:bg-zinc-50 transition-colors group hover:bg-zinc-50/50 text-left"
            >
              <div className="flex items-center justify-center rounded-xl bg-surface-high text-text-muted shrink-0 size-10">
                <User className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-text-body">Información Personal</p>
                {user?.phone && <p className="text-sm text-text-muted">{user.phone}</p>}
              </div>
              <ChevronRight className="text-text-muted" />
            </button>
            <div className="h-px bg-zinc-50 mx-4"></div>
            <div className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center rounded-xl bg-surface-high text-text-muted shrink-0 size-10">
                <MapPin className="size-5" />
              </div>
              <p className="text-base font-medium flex-1 text-text-body">Direcciones</p>
              <ChevronRight className="text-text-muted opacity-30" />
            </div>
            <div className="h-px bg-zinc-50 mx-4"></div>
            <div className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center rounded-xl bg-surface-high text-text-muted shrink-0 size-10">
                <CreditCard className="size-5" />
              </div>
              <p className="text-base font-medium flex-1 text-text-body">Métodos de Pago</p>
              <ChevronRight className="text-text-muted opacity-30" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="px-6 pb-3 text-sm font-semibold text-text-muted uppercase tracking-wider">
            Actividad
          </h2>
          <div className="glass-panel ghost-border mx-4 rounded-2xl overflow-hidden">
            <Link
              href="/profile/orders"
              className="flex items-center gap-4 p-4 hover:bg-zinc-50/50"
            >
              <div className="flex items-center justify-center rounded-xl bg-surface-high shrink-0 size-10">
                <ShoppingBag className="size-5 text-text-muted" />
              </div>
              <p className="text-base font-medium flex-1">Mis Pedidos</p>
              <ChevronRight className="text-text-muted" />
            </Link>
            <div className="h-px bg-zinc-50 mx-4"></div>
            <Link
              href="/profile/listings"
              className="flex items-center gap-4 p-4 hover:bg-zinc-50/50"
            >
              <div className="flex items-center justify-center rounded-xl bg-surface-high shrink-0 size-10">
                <Package className="size-5 text-text-muted" />
              </div>
              <p className="text-base font-medium flex-1">En Venta</p>
              <ChevronRight className="text-text-muted" />
            </Link>
            <div className="h-px bg-zinc-50 mx-4"></div>
            <Link href="/wishlist" className="flex items-center gap-4 p-4 hover:bg-zinc-50/50">
              <div className="flex items-center justify-center rounded-xl bg-surface-high shrink-0 size-10">
                <Heart className="size-5 text-text-muted" />
              </div>
              <p className="text-base font-medium flex-1">Lista de Deseos</p>
              <ChevronRight className="text-text-muted" />
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="px-6 pb-3 text-sm font-semibold text-text-muted uppercase tracking-wider">
            Ajustes
          </h2>
          <div className="glass-panel ghost-border mx-4 rounded-2xl overflow-hidden">
            {user?.role?.name === 'admin' && (
              <Link
                href="/admin/imports"
                className="flex items-center gap-4 p-4 hover:bg-orange-50/50"
              >
                <div className="flex items-center justify-center rounded-xl bg-orange-100 shrink-0 size-10">
                  <Archive className="size-5 text-orange-600" />
                </div>
                <p className="text-base font-medium flex-1">Artículos a Importar</p>
                <ChevronRight className="text-text-muted" />
              </Link>
            )}
            {user?.role?.name?.toLowerCase() === 'seller' && (
              <Link
                href="/profile/seller-wallet"
                className="flex items-center gap-4 p-4 hover:bg-teal-50/50"
              >
                <div className="flex items-center justify-center rounded-xl bg-teal-100 shrink-0 size-10">
                  <Banknote className="size-5 text-teal-600" />
                </div>
                <p className="text-base font-medium flex-1">Wallet de Vendedor</p>
                <ChevronRight className="text-text-muted" />
              </Link>
            )}
            <div className="flex items-center gap-4 p-4 hover:bg-zinc-50/50">
              <div className="flex items-center justify-center rounded-xl bg-surface-high text-text-muted shrink-0 size-10">
                <Settings className="size-5" />
              </div>
              <p className="text-base font-medium flex-1">Configuración</p>
              <ChevronRight className="text-text-muted" />
            </div>
            <div className="h-px bg-zinc-50 mx-4"></div>
            <FlowButton
              variant="ghost"
              simple
              onClick={logout}
              className="w-full flex items-center gap-4 p-4 hover:bg-red-50 text-red-500 rounded-none justify-start border-0"
            >
              <div className="flex items-center justify-center rounded-xl bg-red-50 text-red-500 shrink-0 size-10">
                <LogOut className="size-5" />
              </div>
              <p className="text-base font-medium flex-1 text-left">Cerrar Sesión</p>
            </FlowButton>
          </div>
        </div>
      </div>
    </MobilePageContainer>
  );
}
