'use client';

import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import type { NavbarTcgTabsProps } from '../types';
import { OverflowTcgMenu } from './OverflowTcgMenu';

export function NavbarTcgTabs({
  activeTcgs,
  openTcgId,
  pathname,
  onTcgClick,
  onTcgHover,
  onInicioClick,
  mounted,
}: NavbarTcgTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measuringRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const itemWidths = useRef<number[]>([]);

  // Measure items once they are mounted
  useLayoutEffect(() => {
    if (!mounted || !measuringRef.current) return;

    const children = Array.from(measuringRef.current.children) as HTMLElement[];
    const widths = children.map((child) => child.offsetWidth + 4); // +4 for gap-1
    itemWidths.current = widths;
    setIsMeasuring(false);
  }, [mounted, activeTcgs]);

  // Handle resizing
  useLayoutEffect(() => {
    if (isMeasuring || !containerRef.current || itemWidths.current.length === 0) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const moreButtonWidth = 80;
      const inicioWidth = 72; // Approximate width of "Inicio" button

      let currentWidth = inicioWidth + 8; // Base width with some padding
      let count = 0;

      for (let i = 0; i < itemWidths.current.length; i++) {
        const itemWidth = itemWidths.current[i];
        const isLast = i === itemWidths.current.length - 1;
        const neededWidth = currentWidth + itemWidth + (isLast ? 0 : moreButtonWidth);

        if (neededWidth > containerWidth) {
          break;
        }
        currentWidth += itemWidth;
        count++;
      }

      setVisibleCount(count);
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    handleResize();

    return () => observer.disconnect();
  }, [isMeasuring]);

  const visibleTcgs = useMemo(() => activeTcgs.slice(0, visibleCount), [activeTcgs, visibleCount]);
  const overflowTcgs = useMemo(() => activeTcgs.slice(visibleCount), [activeTcgs, visibleCount]);

  return (
    <div
      ref={containerRef}
      className="hidden lg:flex items-center gap-1 flex-1 min-w-0 h-10 relative"
    >
      {/* Measurement Ghost - Hidden from user but takes space for measurement */}
      <div
        ref={measuringRef}
        className="absolute opacity-0 pointer-events-none flex items-center gap-1 -z-10 invisible"
        aria-hidden="true"
      >
        {activeTcgs.map((tcg) => (
          <div
            key={`measure-${tcg.id}`}
            className="px-4 py-2 text-sm font-semibold border whitespace-nowrap"
          >
            {tcg.display_name || tcg.name}
            <ChevronDown className="size-4 ml-2 inline-block" />
          </div>
        ))}
      </div>

      <Link
        href="/"
        onClick={onInicioClick}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer border shrink-0',
          pathname === '/'
            ? 'text-teal bg-teal/15 border-teal/20 shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.15)]'
            : 'text-vault-text-muted hover:text-white hover:bg-white/5 border-transparent hover:border-white/5'
        )}
      >
        Inicio
      </Link>

      {mounted && !isMeasuring && (
        <>
          {visibleTcgs.map((tcg) => {
            const tcgSlug = tcgNameToSlug(tcg.name);
            const isPathActive = pathname === `/${tcgSlug}` || pathname.startsWith(`/${tcgSlug}/`);
            const isOpen = openTcgId === tcg.id;

            return (
              <button
                key={tcg.id}
                onClick={(e) => onTcgClick(tcg, e)}
                onMouseEnter={(e) => onTcgHover(tcg, e)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer border group shrink-0 whitespace-nowrap',
                  isPathActive || isOpen
                    ? 'text-teal bg-teal/15 border-teal/20 shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.15)]'
                    : 'text-vault-text-muted hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
                )}
              >
                <span className="leading-none">{tcg.display_name || tcg.name}</span>
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform duration-300 shrink-0 opacity-60 group-hover:opacity-100',
                    isOpen && 'rotate-180 opacity-100'
                  )}
                />
              </button>
            );
          })}

          {overflowTcgs.length > 0 && (
            <OverflowTcgMenu
              items={overflowTcgs}
              pathname={pathname}
              onTcgClick={onTcgClick}
              onTcgHover={onTcgHover}
              openTcgId={openTcgId}
            />
          )}
        </>
      )}
    </div>
  );
}
