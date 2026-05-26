'use client';

import { useEffect } from 'react';
import { LoadingIcon } from './LoadingIcon';

interface LoadingOverlayProps {
  label?: string;
  className?: string;
}

export function LoadingOverlay({
  label = 'Cargando Hydra...',
  className = '',
}: LoadingOverlayProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[300] bg-vault-bg/90 backdrop-blur-md flex flex-col items-center justify-center animate-page-enter ${className}`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-teal/5 blur-[120px] rounded-full pointer-events-none" />
      <LoadingIcon size="lg" label={label} />
    </div>
  );
}
