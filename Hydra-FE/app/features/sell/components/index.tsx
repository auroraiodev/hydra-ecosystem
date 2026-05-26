'use client';

import dynamic from 'next/dynamic';

export const SellHero = dynamic(() => import('./SellHero').then((mod) => mod.SellHero));
export const SellBenefits = dynamic(() => import('./SellBenefits').then((mod) => mod.SellBenefits));
export const SellProcess = dynamic(() => import('./SellProcess').then((mod) => mod.SellProcess));
export const SellFAQ = dynamic(() => import('./SellFAQ').then((mod) => mod.SellFAQ));
export const SellCTA = dynamic(() => import('./SellCTA').then((mod) => mod.SellCTA));
