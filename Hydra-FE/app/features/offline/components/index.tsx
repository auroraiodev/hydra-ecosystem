import dynamic from 'next/dynamic';

export const OfflineView = dynamic(() => import('./OfflineView').then((mod) => mod.OfflineView));
