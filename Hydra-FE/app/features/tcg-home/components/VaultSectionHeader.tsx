'use client';

import Link from 'next/link';
import { LucideIcon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultSectionHeaderProps {
  title: string;
  href: string;
  icon?: LucideIcon;
  className?: string;
}

export function VaultSectionHeader({
  title,
  href,
  icon: Icon = Zap,
  className,
}: VaultSectionHeaderProps) {
  // Split title to highlight the last word if it has more than one
  const words = title.split(' ');
  const mainTitle = words.length > 1 ? words.slice(0, -1).join(' ') : title;
  const lastWord = words.length > 1 ? words[words.length - 1] : '';

  return (
    <div className={cn('flex items-center justify-between mb-8 group/section relative', className)}>
      <div className="flex items-center gap-4">
        <div className="size-10 lg:w-12 lg:h-12 rounded-xl bg-teal/10 flex items-center justify-center border border-teal/20 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.1)] group-hover/section:shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.2)] transition-all duration-500">
          <Icon className="size-6 lg:w-7 lg:h-7 text-teal" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl lg:text-3xl font-semibold text-white tracking-tight uppercase leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            {mainTitle} {lastWord && <span className="text-teal">{lastWord}</span>}
          </h2>
          <div className="mt-2 w-10 h-1 bg-gradient-to-r from-teal to-transparent rounded-full opacity-60 group-hover/section:w-20 group-hover/section:opacity-100 transition-all duration-700" />
        </div>
      </div>

      <Link
        href={href}
        className="text-xs font-bold text-vault-text-muted hover:text-teal transition-all px-4 py-2 rounded-full border border-white/10 hover:border-teal/40 bg-white/5 hover:bg-teal/5 flex items-center gap-2 group/btn"
      >
        <span>VER MÁS</span>
        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
      </Link>
    </div>
  );
}
