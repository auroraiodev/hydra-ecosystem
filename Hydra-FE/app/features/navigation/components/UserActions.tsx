'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ShoppingCart, Heart, Archive } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { fixEncoding } from '@/lib/utils/encoding';
import type { UserActionsProps } from '../types';

const NotificationDropdown = dynamic(
  () => import('@/features/notifications/components').then((m) => m.NotificationDropdown),
  { ssr: false }
);

export function UserActions({
  authLoading,
  isAuthenticated,
  user,
  cartItemCount,
  wishlistCount,
  mounted,
}: UserActionsProps) {
  const [avatarErrorUrl, setAvatarErrorUrl] = useState<string | null>(null);
  const avatarUrl = user?.avatar_url;
  const avatarError = avatarUrl === avatarErrorUrl;

  const firstName = user?.first_name ? fixEncoding(user.first_name) : '';
  const lastName = user?.last_name ? fixEncoding(user.last_name) : '';
  const displayName =
    isAuthenticated && user ? `${firstName} ${lastName}`.trim() || 'Usuario' : 'Usuario';
  const userInitials =
    isAuthenticated && user ? `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() : 'JD';

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative">
        <FlowButton
          asChild
          variant="ghost"
          size="icon"
          simple={true}
          className="p-2 text-vault-text-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300 rounded-xl hover:scale-105 active:scale-95"
          aria-label={`Carrito de compras${cartItemCount > 0 ? ` (${cartItemCount} items)` : ''}`}
        >
          <Link href="/cart">
            <ShoppingCart className="size-6" />
          </Link>
        </FlowButton>
        {cartItemCount > 0 && (
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 bg-teal text-teal-foreground text-[10px] font-bold rounded-full min-size-4 px-1 flex items-center justify-center shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.3)]">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}
      </div>
      {user?.role?.name === 'admin' && (
        <FlowButton
          asChild
          variant="ghost"
          size="icon"
          className="relative p-2 text-gold hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 rounded-xl hover:scale-105 active:scale-95"
          aria-label="Artículos a importar"
          title="Artículos a importar"
        >
          <Link href="/admin/imports">
            <Archive className="size-6" />
          </Link>
        </FlowButton>
      )}
      {isAuthenticated && (
        <div className="relative">
          <FlowButton
            asChild
            variant="ghost"
            size="icon"
            simple={true}
            className="p-2 text-vault-text-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300 rounded-xl hover:scale-105 active:scale-95"
            aria-label="Mis favoritos"
          >
            <Link href="/wishlist">
              <Heart className="size-6" />
            </Link>
          </FlowButton>
          {wishlistCount > 0 && (
            <span className="pointer-events-none absolute -top-0.5 -right-0.5 bg-teal text-teal-foreground text-[10px] font-bold rounded-full min-size-4 px-1 flex items-center justify-center shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.3)]">
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
        </div>
      )}

      {mounted && !authLoading && isAuthenticated && <NotificationDropdown />}

      {authLoading || !mounted ? (
        <Skeleton className="size-9 rounded-full shrink-0 ml-1 bg-white/10" />
      ) : isAuthenticated && user?.first_name ? (
        <Link
          href="/profile"
          className="hidden sm:flex items-center gap-2 ml-1 pl-1 pr-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
          aria-label="Mi perfil"
        >
          {avatarUrl && !avatarError ? (
            <div className="relative size-8 rounded-full overflow-hidden ring-2 ring-teal/20 group-hover:ring-teal/40 transition-all">
              <Image
                key={avatarUrl}
                src={avatarUrl}
                alt={`Perfil de ${displayName}`}
                width={32}
                height={32}
                className="rounded-full object-cover"
                onError={() => {
                  setAvatarErrorUrl(avatarUrl);
                }}
              />
            </div>
          ) : (
            <div className="size-8 rounded-full bg-teal text-teal-foreground flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(var(--glow-teal-rgb)/0.2)]">
              {userInitials}
            </div>
          )}
          <span className="text-sm font-semibold text-vault-text hidden xl:block group-hover:text-white transition-colors">
            {displayName}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:flex items-center gap-1 ml-1">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-vault-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm font-bold bg-teal text-teal-foreground rounded-xl hover:opacity-90 shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.2)] transition-all active:scale-95"
          >
            Únete
          </Link>
        </div>
      )}
    </div>
  );
}
