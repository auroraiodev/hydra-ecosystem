'use client';

import { useEffect, useReducer } from 'react';
import { LoadingIcon } from './LoadingIcon';
import type { PublicSettings } from '@/lib/api/settings';

function visibilityReducer(state: boolean, action: { type: 'HIDE' }): boolean {
  return action.type === 'HIDE' ? false : state;
}

export function PageLoadingOverlay({ initialSettings }: { initialSettings?: PublicSettings }) {
  const [isVisible, dispatch] = useReducer(visibilityReducer, true);

  useEffect(() => {
    const hasShown = sessionStorage.getItem('hydra_loader_shown');
    if (hasShown) {
      dispatch({ type: 'HIDE' });
      return;
    }

    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      document.body.style.overflow = '';
      sessionStorage.setItem('hydra_loader_shown', 'true');
      dispatch({ type: 'HIDE' });
    }, 700);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-vault-bg flex flex-col items-center justify-center transition-all duration-700 pointer-events-none ${
        isVisible ? 'opacity-100' : 'opacity-0 scale-105'
      }`}
    >
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-teal/5 blur-[120px] rounded-full" />

        <div className="relative flex flex-col items-center gap-6">
          <LoadingIcon size="lg" label="Iniciando Hydra..." initialSettings={initialSettings} />
        </div>
      </div>
    </div>
  );
}
