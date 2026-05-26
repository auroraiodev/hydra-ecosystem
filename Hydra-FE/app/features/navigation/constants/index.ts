import { Home, ShoppingCart, Heart, User } from 'lucide-react';

export const NAVIGATION_CONSTANTS = {
  HIDE_BOTTOM_NAV: ['/checkout'],
  REFETCH_INTERVAL_MS: 300000,
} as const;

export const REFETCH_INTERVAL_MS = NAVIGATION_CONSTANTS.REFETCH_INTERVAL_MS;

export const BOTTOM_NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Carrito', href: '/cart', icon: ShoppingCart },
  { label: 'Favoritos', href: '/wishlist', icon: Heart },
  { label: 'Mi Perfil', href: '/profile', icon: User },
];

export const FOOTER_SHOP_LINKS = [
  { label: 'Singles', href: '/singles' },
  { label: 'Sellados', href: '/sealed' },
  { label: 'Accesorios', href: '/accessories' },
  { label: 'Novedades', href: '/new-arrivals' },
];

export const FOOTER_CATEGORY_LINKS = [
  { label: 'Magic: The Gathering', href: '/mtg' },
  { label: 'Pokémon TCG', href: '/pokemon' },
  { label: 'Yu-Gi-Oh!', href: '/yugioh' },
  { label: 'One Piece CG', href: '/one-piece' },
];

export const FOOTER_SUPPORT_LINKS = [
  { label: 'Centro de Ayuda', href: '/help' },
  { label: 'Envíos y Entregas', href: '/shipping' },
  { label: 'Preguntas Frecuentes', href: '/faq' },
  { label: 'Contacto', href: '/contact' },
];

export const FOOTER_LEGAL_LINKS = [
  { label: 'Términos y Condiciones', href: '/terms' },
  { label: 'Aviso de Privacidad', href: '/privacy' },
  { label: 'Política de Cookies', href: '/cookies' },
  { label: 'Política de Devolución', href: '/refunds' },
];
