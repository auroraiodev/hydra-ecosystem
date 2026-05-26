'use client';

import Image from 'next/image';

import { resolveImageUrl } from '@/lib/utils/imageUrl';
import { use3DTilt } from '@/features/shared/hooks/use3DTilt';
import { ChevronRight } from 'lucide-react';
import type { TcgApiResponse } from '@/features/tcg/types';
import { TCG_COLOR_FALLBACK } from '@/features/tcg/constants';

interface TcgCardProps {
  tcg: TcgApiResponse;
  onClick?: () => void;
  index?: number;
}

/* ── Premium text-logo lockups for when no image is available ── */
const TCG_LOGO_STYLES: Record<
  string,
  { pre?: string; main: string; sub?: string; fontScale?: string }
> = {
  magic: {
    pre: 'MAGIC',
    main: 'The Gathering',
    sub: '',
    fontScale: 'scale-[0.95]',
  },
  pokemon: {
    main: 'Pokémon',
    sub: 'TCG',
    fontScale: 'scale-110',
  },
  yugioh: {
    main: 'YU-GI-OH!',
    sub: 'TRADING CARD GAME',
    fontScale: 'scale-105',
  },
  'one-piece': {
    main: 'ONE PIECE',
    sub: 'CARD GAME',
    fontScale: 'scale-100',
  },
};

function TcgTextLogo({ tcg, color }: { tcg: TcgApiResponse; color: string }) {
  const style = TCG_LOGO_STYLES[tcg.slug] ?? { main: tcg.name.toUpperCase() };
  const isMagic = tcg.slug === 'magic';
  const isPokemon = tcg.slug === 'pokemon';
  const isYugioh = tcg.slug === 'yugioh';
  const isOnePiece = tcg.slug === 'one-piece';

  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center leading-none select-none ${style.fontScale ?? ''}`}
    >
      {/* Magic: stylised two-line lockup */}
      {isMagic && (
        <div className="flex flex-col items-center">
          <span
            className="text-[26px] sm:text-[32px] font-black tracking-[0.15em] uppercase"
            style={{
              color,
              textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
            }}
          >
            {style.pre}
          </span>
          <span
            className="text-[11px] sm:text-[13px] font-bold tracking-[0.35em] uppercase mt-0.5"
            style={{ color: `${color}cc` }}
          >
            {style.main}
          </span>
        </div>
      )}

      {/* Pokémon: bold rounded with subtle gradient */}
      {isPokemon && (
        <div className="flex flex-col items-center">
          <span
            className="text-[28px] sm:text-[34px] font-black tracking-tight"
            style={{
              color,
              textShadow: `0 2px 10px ${color}50, 0 0 30px ${color}30`,
              letterSpacing: '-0.02em',
            }}
          >
            {style.main}
          </span>
          <span
            className="text-[12px] sm:text-[14px] font-bold tracking-[0.2em] mt-0.5"
            style={{ color: `${color}aa` }}
          >
            {style.sub}
          </span>
        </div>
      )}

      {/* Yu-Gi-Oh!: sharp, aggressive, wide tracking */}
      {isYugioh && (
        <div className="flex flex-col items-center">
          <span
            className="text-[22px] sm:text-[28px] font-black tracking-[0.08em] italic"
            style={{
              color,
              textShadow: `0 0 16px ${color}70, 0 0 32px ${color}40`,
              WebkitTextStroke: `1px ${color}40`,
            }}
          >
            {style.main}
          </span>
          <span
            className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] mt-1"
            style={{ color: `${color}99` }}
          >
            {style.sub}
          </span>
        </div>
      )}

      {/* One Piece: bold, adventurous */}
      {isOnePiece && (
        <div className="flex flex-col items-center">
          <span
            className="text-[24px] sm:text-[30px] font-black tracking-[0.06em]"
            style={{
              color,
              textShadow: `0 2px 12px ${color}50, 0 0 28px ${color}25`,
            }}
          >
            {style.main}
          </span>
          <span
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] mt-1"
            style={{ color: `${color}aa` }}
          >
            {style.sub}
          </span>
        </div>
      )}

      {/* Generic fallback */}
      {!isMagic && !isPokemon && !isYugioh && !isOnePiece && (
        <span
          className="text-2xl sm:text-3xl font-black tracking-tighter"
          style={{ color, textShadow: `0 0 30px ${color}50` }}
        >
          {tcg.slug.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function TcgCard({ tcg, onClick, index = 0 }: TcgCardProps) {
  const { ref, style, onMouseMove, onMouseLeave } = use3DTilt(8);

  const color = tcg.primaryColor ?? TCG_COLOR_FALLBACK[tcg.slug] ?? '#14b8a6';

  const bgStyle: React.CSSProperties = {
    background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 65%), linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
  };

  const floatClass =
    index % 3 === 0
      ? 'animate-logo-float'
      : index % 3 === 1
        ? 'animate-logo-float-delayed'
        : 'animate-logo-float-slow';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      className="flex-shrink-0 w-[180px] sm:w-[220px] animate-fade-up-scale text-left block"
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div
        ref={ref}
        style={style}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative group cursor-pointer"
      >
        {/* Animated border glow ring */}
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-border-glow-pulse pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${color}60, transparent, ${color}40)`,
          }}
        />

        <div
          className="relative overflow-hidden rounded-2xl vault-glass-card h-[240px] sm:h-[280px] flex flex-col items-center p-4 transition-shadow duration-300"
          style={bgStyle}
        >
          {/* Shimmer sweep on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 size-full"
              style={{
                background: `linear-gradient(105deg, transparent 40%, ${color}12 50%, transparent 60%)`,
                animation: 'shimmer-sweep 700ms ease-in-out infinite',
              }}
            />
          </div>

          {/* Card count badge */}
          <div
            className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider z-10"
            style={{
              backgroundColor: `${color}18`,
              color,
              border: `1px solid ${color}35`,
              boxShadow: `0 0 12px ${color}15`,
            }}
          >
            {tcg.cardCount.toLocaleString()} artículos
          </div>

          {/* Center content: logo + divider + name — locked to same heights */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
            {/* LOGO — fixed height so every card aligns the same */}
            <div className="h-[88px] sm:h-[104px] flex items-center justify-center">
              <div
                className={`${floatClass} transition-transform duration-500 group-hover:scale-110`}
              >
                {tcg.logoUrl ? (
                  <div className="relative size-20 sm:w-24 sm:h-24">
                    <Image
                      src={resolveImageUrl(tcg.logoUrl)}
                      alt={tcg.name}
                      fill
                      className="object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <TcgTextLogo tcg={tcg} color={color} />
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-4 flex items-center justify-center">
              <div
                className="w-10 h-0.5 rounded-full opacity-60 group-hover:w-14 transition-all duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />
            </div>

            {/* Name */}
            <div className="h-10 sm:h-11 flex items-start justify-center">
              <p className="text-xs sm:text-sm text-vault-text-muted text-center leading-tight px-2">
                {tcg.name}
              </p>
            </div>
          </div>

          {/* Hover hint — always takes same space so layout never shifts */}
          <div className="relative z-10 flex items-center justify-center gap-1 text-[10px] text-vault-text-muted/0 group-hover:text-vault-text-muted transition-all duration-300 h-4 mt-1">
            <span className="translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
              Explorar
            </span>
            <ChevronRight className="size-3 -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </div>
        </div>
      </div>
    </button>
  );
}
