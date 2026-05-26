'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, LayoutGrid, Heart, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import { setSelectedTcg } from '@/lib/store/slices/gameSlice';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { useDispatch } from 'react-redux';
import { usePathname } from 'next/navigation';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { MobileMenuProps } from '../types';

export function MobileMenu({
  isOpen,
  onClose,
  activeTcgs,
  isAuthenticated,
  user,
  cartItemCount,
  wishlistCount,
  siteName,
  siteLogo,
}: MobileMenuProps) {
  const dispatch = useDispatch();
  const pathname = usePathname();

  if (!isOpen) return null;

  const avatarUrl = user?.avatar_url;
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const userInitials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'JD';
  const displayName = `${firstName} ${lastName}`.trim() || 'Usuario';

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden cursor-pointer"
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Cerrar menú"
    >
      <div
        className="fixed inset-y-0 right-0 z-50 w-72 bg-vault-surface border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          } else {
            e.stopPropagation();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative size-7 shrink-0">
              <Image
                src={resolveImageUrl(siteLogo) || '/cat.png'}
                alt={`${siteName} Logo`}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-white">Menú</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-vault-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1 mb-6">
            {/* Inicio */}
            <Link
              href="/"
              onClick={() => {
                dispatch(setSelectedTcg(null));
                onClose();
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                pathname === '/'
                  ? 'text-teal bg-teal/10 font-semibold'
                  : 'text-vault-text hover:bg-white/5'
              )}
            >
              <LayoutGrid className="size-5 shrink-0" />
              <span>Inicio</span>
            </Link>

            {/* Dynamic TCG links */}
            {activeTcgs.map((tcg) => {
              const slug = tcgNameToSlug(tcg.name);
              const isActive = pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
              return (
                <Link
                  key={tcg.id}
                  href={`/${slug}`}
                  onClick={() => {
                    dispatch(setSelectedTcg(tcg));
                    onClose();
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                    isActive
                      ? 'text-teal bg-teal/10 font-semibold'
                      : 'text-vault-text hover:bg-white/5'
                  )}
                >
                  <span>{tcg.display_name || tcg.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-4">
            {isAuthenticated ? (
              <div className="flex flex-col gap-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl"
                  onClick={onClose}
                >
                  {avatarUrl ? (
                    <div className="relative size-9 rounded-full overflow-hidden ring-2 ring-teal/20">
                      <Image
                        src={resolveImageUrl(avatarUrl)}
                        alt={`Avatar de ${displayName}`}
                        width={36}
                        height={36}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="size-9 rounded-full bg-teal text-teal-foreground flex items-center justify-center font-bold text-sm">
                      {userInitials}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{displayName}</span>
                    <span className="text-xs text-vault-text-muted">Ver perfil</span>
                  </div>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-vault-text"
                  onClick={onClose}
                >
                  <div className="relative">
                    <Heart className="size-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal text-teal-foreground text-[10px] font-bold rounded-full min-size-4 px-1 flex items-center justify-center">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </div>
                  <span>Favoritos</span>
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl text-vault-text"
                  onClick={onClose}
                >
                  <div className="relative">
                    <ShoppingCart className="size-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal text-teal-foreground text-[10px] font-bold rounded-full min-size-4 px-1 flex items-center justify-center">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </div>
                  <span>Carrito</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <FlowButton asChild variant="default" className="w-full justify-center">
                  <Link href="/login" onClick={onClose}>
                    Iniciar sesión
                  </Link>
                </FlowButton>
                <FlowButton asChild variant="outline" className="w-full justify-center">
                  <Link href="/signup" onClick={onClose}>
                    Registrarse
                  </Link>
                </FlowButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
