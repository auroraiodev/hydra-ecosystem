import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { getActiveTcgs } from '@/features/tcg/api';
import type { TcgApiResponse } from '@/features/tcg/types';
import { TCG_COLOR_FALLBACK } from '@/features/tcg/constants';
import { TcgCarousel } from './TcgCarousel';

const FALLBACK_TCGS: TcgApiResponse[] = [
  {
    id: 'magic',
    name: 'Magic: The Gathering',
    displayName: 'Magic: The Gathering',
    slug: 'mtg',
    logoUrl: null,
    iconUrl: null,
    cardCount: 10000,
    primaryColor: TCG_COLOR_FALLBACK.magic,
    isActive: true,
    order: 1,
  },
  {
    id: 'pokemon',
    name: 'Pokémon TCG',
    displayName: 'Pokémon TCG',
    slug: 'pokemon',
    logoUrl: null,
    iconUrl: null,
    cardCount: 5000,
    primaryColor: TCG_COLOR_FALLBACK.pokemon,
    isActive: true,
    order: 2,
  },
  {
    id: 'yugioh',
    name: 'Yu-Gi-Oh!',
    displayName: 'Yu-Gi-Oh!',
    slug: 'yugioh',
    logoUrl: null,
    iconUrl: null,
    cardCount: 3000,
    primaryColor: TCG_COLOR_FALLBACK.yugioh,
    isActive: true,
    order: 3,
  },
  {
    id: 'onepiece',
    name: 'One Piece CG',
    displayName: 'One Piece CG',
    slug: 'one-piece',
    logoUrl: null,
    iconUrl: null,
    cardCount: 2000,
    primaryColor: TCG_COLOR_FALLBACK['one-piece'],
    isActive: true,
    order: 4,
  },
];

function FloatingCardStack() {
  return (
    <div className="relative size-[260px] sm:w-[300px] sm:h-[300px] lg:w-[340px] lg:h-[340px] perspective-1000 mx-auto lg:mx-0 shrink-0">
      {/* Rotating orbital rings */}
      <div className="absolute inset-0 rounded-full border border-teal/10 animate-[spin_10s_linear_infinite]" />
      <div className="absolute inset-3 rounded-full border border-dashed border-white/5 animate-[spin_16s_linear_infinite_reverse]" />
      <div className="absolute inset-6 rounded-full border border-teal/5 animate-[spin_20s_linear_infinite]" />

      {/* Floating decorative cards */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-float-delayed">
        <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-gradient-to-br from-teal/40 to-vault-surface border border-teal/30 shadow-lg shadow-teal/20 rotate-6 backdrop-blur-sm" />
      </div>

      <div className="absolute -bottom-3 -right-3 z-20 animate-float-slow">
        <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg bg-gradient-to-br from-gold/40 to-vault-surface border border-gold/30 shadow-lg shadow-gold/20 -rotate-12 backdrop-blur-sm" />
      </div>

      <div className="absolute -bottom-2 -left-2 z-20 animate-float">
        <div className="w-8 h-12 sm:w-10 sm:h-14 rounded-lg bg-gradient-to-br from-white/20 to-vault-surface border border-white/20 shadow-lg shadow-white/10 rotate-12 backdrop-blur-sm" />
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 bg-teal/10 blur-[100px] rounded-full animate-pulse" />

      {/* Center orb with cat */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative size-[170px] sm:w-[200px] sm:h-[200px] lg:w-[230px] lg:h-[230px] animate-float group transition-transform duration-700 hover:scale-105">
          {/* Glow ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-teal/20 via-primary/10 to-gold/20 vault-accent-glow opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Glass backdrop */}
          <div className="absolute inset-0 rounded-full bg-vault-surface/40 backdrop-blur-md border border-white/10 shadow-2xl" />

          {/* Cat image */}
          <div className="absolute inset-2 sm:inset-3 rounded-full overflow-hidden flex items-center justify-center p-3 sm:p-4">
            <Image
              src="/cat.png"
              alt="Hydra Cat"
              fill
              sizes="(max-width: 640px) 170px, (max-width: 1024px) 200px, 230px"
              className="object-contain drop-shadow-[0_0_15px_rgba(var(--glow-teal-rgb)/0.4)] group-hover:drop-shadow-[0_0_30px_rgba(var(--glow-teal-rgb)/0.6)] transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Orbital sparkles */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 animate-float-delayed">
        <Sparkles className="size-5 sm:h-7 sm:w-7 text-gold/50" />
      </div>
      <div className="absolute bottom-8 left-2 sm:bottom-10 sm:left-4 animate-float-slow">
        <Sparkles className="size-4 sm:h-5 sm:w-5 text-teal/40" />
      </div>
      <div className="absolute top-1/2 -right-1 sm:right-0 animate-float">
        <Sparkles className="size-3 sm:h-4 sm:w-4 text-white/30" />
      </div>
    </div>
  );
}

export async function HeroSection() {
  let tcgs: TcgApiResponse[] = [];
  try {
    tcgs = await getActiveTcgs();
  } catch {
    tcgs = [];
  }

  const displayTcgs = tcgs.length > 0 ? tcgs : FALLBACK_TCGS;

  return (
    <section className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-vault-bg -mt-14 pt-24 pb-16">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at center, oklch(0.65 0.18 175 / 0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-20 right-1/4 size-[400px] opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, oklch(0.75 0.15 85 / 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-teal/10 text-teal border border-teal/20 animate-glow-pulse">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-teal" />
            </span>
            Catálogo disponible
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 mb-12">
          <div className="text-center lg:text-left max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
              TCG Hydra
              <br />
              <span className="vault-text-gradient">Marketplace</span>
            </h1>
            <p className="mt-4 text-lg text-vault-text-muted max-w-lg mx-auto lg:mx-0">
              Selecciona un juego para explorar su catalogo de cartas singles, sellados y
              accesorios.
            </p>
          </div>
          <FloatingCardStack />
        </div>

        <Suspense
          fallback={
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 -mx-1 no-scrollbar pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[180px] sm:w-[220px] rounded-2xl border border-white/5 bg-vault-surface/20 backdrop-blur-md h-[240px] sm:h-[280px] flex flex-col items-center p-4 animate-pulse overflow-hidden relative"
                >
                  {/* Card count badge skeleton */}
                  <div className="absolute top-3 right-3 w-16 sm:w-20 h-4 rounded-full bg-white/5" />

                  {/* Logo container skeleton */}
                  <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
                    <div className="h-[88px] sm:h-[104px] flex items-center justify-center">
                      <div className="size-16 sm:size-20 rounded-full bg-white/5" />
                    </div>
                    {/* Divider */}
                    <div className="w-12 h-px bg-white/10 my-3" />
                    {/* Name */}
                    <div className="h-4 w-3/4 bg-white/10 rounded-lg mb-1.5" />
                    {/* Button text simulation */}
                    <div className="h-3 w-1/2 bg-white/5 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <TcgCarousel tcgs={displayTcgs} />
        </Suspense>
      </div>
    </section>
  );
}
