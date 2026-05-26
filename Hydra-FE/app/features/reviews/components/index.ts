import dynamic from 'next/dynamic';

export const ReviewModal = dynamic(() => import('./ReviewModal').then((mod) => mod.ReviewModal));
