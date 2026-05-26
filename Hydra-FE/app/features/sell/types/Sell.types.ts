import { LucideIcon } from 'lucide-react';
import type { PublicSettings } from '@/lib/api/settings';

export interface SellBenefit {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface SellFAQItem {
  question: string;
  answer: string;
}

export interface SellProcessStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface SellHeroProps {
  settings?: PublicSettings;
  siteName: string;
}
