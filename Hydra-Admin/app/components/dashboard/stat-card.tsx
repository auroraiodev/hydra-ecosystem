'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowTrending24Regular,
  People24Regular,
  Cart24Regular,
  ArrowUpRight24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import type React from 'react';

const ICON_MAP: Record<string, React.ElementType> = {
  trending: ArrowTrending24Regular,
  people: People24Regular,
  cart: Cart24Regular,
};

interface StatCardProps {
  title: string;
  value: string;
  sub: string;
  iconName: 'trending' | 'people' | 'cart';
  iconColor: string;
  href?: string;
}

export function StatCard({ title, value, sub, iconName, iconColor, href }: StatCardProps) {
  const Icon = ICON_MAP[iconName];
  const inner = (
    <CardContent className="p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 font-display">
            {title}
          </p>
          <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums font-display">
            {value}
          </p>
          <p className="text-[10px] font-bold text-foreground/50 tracking-wide">{sub}</p>
        </div>
        <div className={cn('p-3 rounded-2xl shadow-lush shrink-0', iconColor)}>
          <Icon className="size-5 text-white" />
        </div>
      </div>
      {href && (
        <div className="mt-6 pt-6 border-t border-primary/5">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary group-hover:gap-2.5 transition-all">
            Explorar <ArrowUpRight24Regular className="size-3" />
          </p>
        </div>
      )}
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        <Card className="glass-card overflow-hidden border-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
          {inner}
        </Card>
      </Link>
    );
  }

  return <Card className="glass-card overflow-hidden border-none">{inner}</Card>;
}
