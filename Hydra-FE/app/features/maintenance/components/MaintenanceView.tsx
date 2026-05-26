'use client';

import Image from 'next/image';
import { MAINTENANCE_TEXT } from '../constants';

export function MaintenanceView() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 selection:bg-primary/30">
      <div className="max-w-xl w-full text-center gap-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        {/* Cat Image Container */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative size-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
              <Image
                src="/cat.png"
                alt="Hydra Maintenance Cat"
                fill
                sizes="(max-width: 640px) 192px, 256px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority
              />
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="gap-y-6">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-tight">
            {MAINTENANCE_TEXT.TITLE_PART_1}
            <br />
            {MAINTENANCE_TEXT.TITLE_PART_2}
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-md mx-auto leading-relaxed">
            {MAINTENANCE_TEXT.DESCRIPTION}
          </p>
        </div>

        {/* Status Indicator & Action */}
        <div className="pt-4 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/50 border border-white/5 text-sm text-zinc-400 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
            </span>
            {MAINTENANCE_TEXT.STATUS}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="group relative px-8 py-3 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">{MAINTENANCE_TEXT.RETRY_BUTTON}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-16 opacity-30">
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-medium">
            &copy; {currentYear} {MAINTENANCE_TEXT.FOOTER_BRAND} &bull;{' '}
            {MAINTENANCE_TEXT.FOOTER_TAGLINE}
          </p>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 size-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] size-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
