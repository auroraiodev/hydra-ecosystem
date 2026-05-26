'use client';

import Link from 'next/link';
import Image from 'next/image';
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
import { DesktopPageContainer } from '@/features/shared/components/PageContainers';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { fixEncoding } from '@/lib/utils/encoding';
import { getCollectorLevel } from '../utils';
import { useProfileStats } from '../hooks/useProfileStats';

import { type ProfileDesktopViewProps } from '../types';

function ProfileAvatarSection({
  isLoading,
  avatarUrl,
  displayName,
  userInitials,
  username,
  userPhone,
  collectorLevel,
  ordersCount,
  isLoadingOrders,
  onEditProfile,
}: {
  isLoading: boolean;
  avatarUrl: string | null;
  displayName: string;
  userInitials: string;
  username: string;
  userPhone?: string | null;
  collectorLevel: ReturnType<typeof getCollectorLevel>;
  ordersCount: number | null;
  isLoadingOrders: boolean;
  onEditProfile: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
      <div className="relative group">
        <div className="size-32 md:w-40 md:h-40 rounded-full p-1 bg-surface shadow-xl ring-4 ring-border-subtle overflow-hidden">
          {isLoading ? (
            <Skeleton className="size-full rounded-full" />
          ) : avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={160}
              height={160}
              className="size-full object-cover rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  const fallback = document.createElement('div');
                  fallback.className =
                    'size-full bg-primary text-white flex items-center justify-center text-2xl md:text-3xl font-bold rounded-full';
                  fallback.textContent = userInitials;
                  target.parentElement.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="size-full bg-primary text-white flex items-center justify-center text-2xl md:text-3xl font-bold rounded-full">
              {userInitials}
            </div>
          )}
        </div>
        {!isLoading && (
          <FlowButton
            variant="default"
            size="icon"
            simple
            className="absolute bottom-2 right-2 bg-primary hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors border-2 border-white size-10"
          >
            <Camera className="text-sm" />
          </FlowButton>
        )}
      </div>
      <div className="flex-1 text-center md:text-left mt-2 md:mt-4">
        {isLoading ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-text-body">{displayName}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${collectorLevel.current.bg} ${collectorLevel.current.color} ${collectorLevel.current.border}`}
              >
                <span>{collectorLevel.current.icon}</span>
                {collectorLevel.current.label}
              </span>
            </div>
            <p className="text-text-muted mb-4">
              {username.startsWith('@') ? username : `@${username}`}
            </p>
            {userPhone && (
              <p className="text-text-muted mb-4 flex items-center gap-2">
                <span className="font-medium">Tel:</span> {userPhone}
              </p>
            )}
            <div className="flex gap-3 justify-center md:justify-start">
              <FlowButton onClick={onEditProfile} variant="outline" size="sm">
                <span className="flex items-center gap-2">
                  <Edit2 className="text-lg" />
                  Editar Perfil
                </span>
              </FlowButton>
              <FlowButton variant="outline" size="sm">
                <span className="flex items-center gap-2">
                  <Share2 className="text-lg" />
                  Compartir
                </span>
              </FlowButton>
            </div>
            {!isLoadingOrders && (
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>
                    {collectorLevel.current.icon} {collectorLevel.current.label}
                  </span>
                  {collectorLevel.next ? (
                    <span>
                      {collectorLevel.next.icon} {collectorLevel.next.label} -{' '}
                      {collectorLevel.next.min - (ordersCount ?? 0)} pedidos
                    </span>
                  ) : (
                    <span>Nivel máximo</span>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-high overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${collectorLevel.levelIndex === 0 ? 'bg-zinc-400' : collectorLevel.levelIndex === 1 ? 'bg-emerald-500' : collectorLevel.levelIndex === 2 ? 'bg-blue-500' : collectorLevel.levelIndex === 3 ? 'bg-primary' : 'bg-amber-500'}`}
                    style={{ width: `${collectorLevel.progress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProfileStatsGrid({ stats }: { stats: ReturnType<typeof useProfileStats> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <Link
        href="/profile/orders"
        className="glass-panel ghost-border p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer block"
      >
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="text-primary text-xl" />
          <span className="text-sm font-bold uppercase text-text-muted tracking-wider">
            Pedidos
          </span>
        </div>
        <div className="text-3xl font-bold text-text-body">
          {stats.isLoadingOrders ? <Skeleton className="size-9" /> : (stats.ordersCount ?? 0)}
        </div>
      </Link>
      <Link
        href="/profile/listings"
        className="glass-panel ghost-border p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer block"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shirt className="text-primary text-xl" />
          <span className="text-sm font-bold uppercase text-text-muted tracking-wider">
            En Venta
          </span>
        </div>
        <div className="text-3xl font-bold text-text-body">
          {stats.isLoadingListings ? <Skeleton className="size-9" /> : (stats.listingsCount ?? 0)}
        </div>
      </Link>
      <Link
        href="/profile/balance"
        className="glass-panel ghost-border p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer block"
      >
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="text-primary text-xl" />
          <span className="text-sm font-bold uppercase text-text-muted tracking-wider">
            Balance
          </span>
        </div>
        <div className="text-3xl font-bold text-text-body">
          {stats.isLoadingBalance ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            `$${stats.balance?.toLocaleString() || 0}`
          )}
        </div>
      </Link>
    </div>
  );
}

function AccountMenuPanel({
  onEditProfile,
  userPhone,
}: {
  onEditProfile: () => void;
  userPhone?: string | null;
}) {
  return (
    <div className="glass-panel ghost-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Cuenta</h2>
      </div>
      <div className="divide-y divide-border-subtle">
        <button
          onClick={onEditProfile}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors text-left"
        >
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <User className="size-4 text-text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-text-body block">Información Personal</span>
            {userPhone && <span className="text-xs text-text-muted">{userPhone}</span>}
          </div>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors text-left">
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <MapPin className="size-4 text-text-muted" />
          </div>
          <span className="flex-1 text-sm font-medium text-text-body">Direcciones</span>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors text-left">
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <CreditCard className="size-4 text-text-muted" />
          </div>
          <span className="flex-1 text-sm font-medium text-text-body">Métodos de Pago</span>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </button>
      </div>
    </div>
  );
}

function ActivityMenuPanel() {
  return (
    <div className="glass-panel ghost-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Actividad
        </h2>
      </div>
      <div className="divide-y divide-border-subtle">
        <Link
          href="/profile/orders"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors"
        >
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <ShoppingBag className="size-4 text-text-muted" />
          </div>
          <span className="flex-1 text-sm font-medium text-text-body">Mis Pedidos</span>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </Link>
        <Link
          href="/profile/listings"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors"
        >
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <Package className="size-4 text-text-muted" />
          </div>
          <span className="flex-1 text-sm font-medium text-text-body">En Venta</span>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </Link>
        <Link
          href="/wishlist"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors"
        >
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <Heart className="size-4 text-text-muted" />
          </div>
          <span className="flex-1 text-sm font-medium text-text-body">Lista de Deseos</span>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </Link>
      </div>
    </div>
  );
}

function SettingsPanel({
  roleName,
  onLogout,
}: {
  roleName?: string | undefined;
  onLogout: () => void;
}) {
  return (
    <div className="mt-6 glass-panel ghost-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Ajustes</h2>
      </div>
      <div className="divide-y divide-border-subtle">
        {roleName === 'admin' && (
          <Link
            href="/admin/imports"
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50/50 transition-colors"
          >
            <div className="size-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <Archive className="size-4 text-orange-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-text-body">Artículos a Importar</span>
            <ChevronRight className="size-4 text-text-muted shrink-0" />
          </Link>
        )}
        {roleName?.toLowerCase() === 'seller' && (
          <Link
            href="/profile/seller-wallet"
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-teal-50/50 transition-colors"
          >
            <div className="size-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
              <Banknote className="size-4 text-teal-600" />
            </div>
            <span className="flex-1 text-sm font-medium text-text-body">Wallet de Vendedor</span>
            <ChevronRight className="size-4 text-text-muted shrink-0" />
          </Link>
        )}
        <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-high transition-colors text-left">
          <div className="size-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
            <Settings className="size-4 text-text-muted" />
          </div>
          <span className="flex-1 text-sm font-medium text-text-body">Configuración</span>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50/50 transition-colors text-left"
        >
          <div className="size-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <LogOut className="size-4 text-red-500" />
          </div>
          <span className="flex-1 text-sm font-medium text-red-500">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export function ProfileDesktopView({ onEditProfile }: ProfileDesktopViewProps) {
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
    <DesktopPageContainer>
      <div className="max-w-5xl mx-auto pt-8 px-4">
        <ProfileAvatarSection
          isLoading={isLoading}
          avatarUrl={avatarUrl}
          displayName={displayName}
          userInitials={userInitials}
          username={username}
          userPhone={user?.phone}
          collectorLevel={collectorLevel}
          ordersCount={stats.ordersCount}
          isLoadingOrders={stats.isLoadingOrders}
          onEditProfile={onEditProfile}
        />
        <ProfileStatsGrid stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AccountMenuPanel onEditProfile={onEditProfile} userPhone={user?.phone} />
          <ActivityMenuPanel />
        </div>
        <SettingsPanel roleName={user?.role?.name} onLogout={logout} />
      </div>
    </DesktopPageContainer>
  );
}
