'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import type { Tcg } from '@/lib/types/tcg';

interface OverflowTcgMenuProps {
  items: Tcg[];
  pathname: string;
  onTcgClick: (tcg: Tcg, e: React.MouseEvent<HTMLButtonElement>, isOverflow?: boolean) => void;
  onTcgHover: (tcg: Tcg, e: React.MouseEvent<HTMLButtonElement>, isOverflow?: boolean) => void;
  openTcgId: string | null;
}

export function OverflowTcgMenu({
  items,
  pathname,
  onTcgClick,
  onTcgHover,
  openTcgId,
}: OverflowTcgMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isTcgInMenuOpen = openTcgId && items.some((t) => t.id === openTcgId);
  const effectivelyOpen = isOpen || isTcgInMenuOpen;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Small buffer
  };

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer border',
          effectivelyOpen
            ? 'text-teal bg-teal/15 border-teal/20 shadow-[0_0_20px_rgba(var(--glow-teal-rgb)/0.15)]'
            : 'text-vault-text-muted hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
        )}
        aria-label="Más juegos"
      >
        <span className="leading-none">Más Juegos</span>
        <ChevronDown
          className={cn(
            'size-4 transition-transform duration-300',
            effectivelyOpen && 'rotate-180'
          )}
        />
      </button>

      {effectivelyOpen && (
        <div className="absolute right-0 mt-0 w-56 vault-glass-panel rounded-xl py-2 z-[70] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1.5 mb-1 text-[10px] font-bold text-vault-text-muted uppercase tracking-wider">
            Más Juegos
          </div>
          {items.map((tcg) => {
            const tcgSlug = tcgNameToSlug(tcg.name);
            const isPathActive = pathname === `/${tcgSlug}` || pathname.startsWith(`/${tcgSlug}/`);
            const isTcgOpen = openTcgId === tcg.id;

            return (
              <button
                key={tcg.id}
                onClick={(e) => {
                  onTcgClick(tcg, e, true);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => onTcgHover(tcg, e, true)}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center justify-between group cursor-pointer',
                  isPathActive || isTcgOpen
                    ? 'text-teal font-semibold bg-teal/10'
                    : 'text-vault-text-muted hover:bg-white/5 hover:text-white'
                )}
              >
                <span>{tcg.display_name || tcg.name}</span>
                <ChevronDown
                  className={cn(
                    'size-3.5 opacity-0 group-hover:opacity-50 transition-opacity',
                    isTcgOpen && 'opacity-100 rotate-180'
                  )}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
