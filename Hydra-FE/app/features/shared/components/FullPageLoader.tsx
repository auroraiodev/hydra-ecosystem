'use client';

import { LoadingIcon } from './LoadingIcon';

interface FullPageLoaderProps {
  label?: string;
  className?: string;
  variant?: 'default' | 'overlay';
}

export function FullPageLoader({
  label = 'Cargando Hydra...',
  className = '',
  variant = 'default',
}: FullPageLoaderProps) {
  const bgClass = variant === 'overlay' ? 'bg-vault-bg/60 backdrop-blur-md' : 'bg-vault-bg';

  return (
    <div
      className={`${bgClass} h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden animate-page-enter ${className}`}
    >
      {/* Background Glows */}
      {variant === 'default' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-teal/5 blur-[120px] rounded-full pointer-events-none" />
      )}
      <h1 className="sr-only">Magic México: Hydra Collectables Marketplace</h1>
      <LoadingIcon size="lg" label={label} />
    </div>
  );
}
