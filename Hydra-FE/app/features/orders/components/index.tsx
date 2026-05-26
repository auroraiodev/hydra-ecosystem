'use client';

import dynamic from 'next/dynamic';

export const OrderCard = dynamic(() => import('./OrderCard').then((mod) => mod.OrderCard));
export const OrderTimeline = dynamic(() =>
  import('./OrderTimeline').then((mod) => mod.OrderTimeline)
);
export const OrderInfoCards = dynamic(() =>
  import('./OrderInfoCards').then((mod) => mod.OrderInfoCards)
);
export const OrderItems = dynamic(() => import('./OrderItems').then((mod) => mod.OrderItems));
export const OrderSidebarSummary = dynamic(() =>
  import('./OrderSidebarSummary').then((mod) => mod.OrderSidebarSummary)
);
export { CopyField } from './CopyField';
