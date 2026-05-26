import dynamic from 'next/dynamic';

export const WishlistView = dynamic(() => import('./WishlistView').then((mod) => mod.WishlistView));

export * from './WishlistItemCard';
export * from './WishlistItemCardDesktop';
export * from './WishlistSummary';
export * from './WishlistEmptyState';
