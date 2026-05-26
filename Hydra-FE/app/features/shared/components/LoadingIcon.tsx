'use client';

import Image from 'next/image';
import { usePublicSettings } from '@/features/shared/hooks/usePublicSettings';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { PublicSettings } from '@/lib/api/settings';

interface LoadingIconProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  initialSettings?: PublicSettings;
}

function LoadingIconBase({
  size = 'md',
  label,
  className = '',
  settings,
}: Omit<LoadingIconProps, 'initialSettings'> & { settings: PublicSettings }) {
  const dimensions = {
    sm: 40,
    md: 80,
    lg: 120,
  };

  const dim = dimensions[size];

  // Use custom loader if available, then site logo, then fallback (the cat icon requested by user)
  const customLoader = settings.site_loader || settings.site_logo;
  const imageSrc = customLoader ? resolveImageUrl(customLoader) : '/cat.png';
  const isDefault = !customLoader;

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        {/* Outer Glow / Pulse */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />

        {/* The Icon itself with a subtle bounce/spin */}
        <div className="relative animate-float" style={{ width: dim, height: dim }}>
          <Image
            src={imageSrc}
            alt="Hydra Loading"
            fill
            sizes="120px"
            className={`object-contain transition-all duration-700 hover:scale-110 opacity-90 ${
              isDefault ? 'filter brightness-0 invert' : ''
            }`}
          />
        </div>
      </div>

      {label && (
        <p className="text-sm font-black text-primary/60 tracking-[0.2em] uppercase animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

function LoadingIconWithHook(props: Omit<LoadingIconProps, 'initialSettings'>) {
  const { settings } = usePublicSettings();
  return <LoadingIconBase {...props} settings={settings} />;
}

export const LoadingIcon = ({ initialSettings, ...props }: LoadingIconProps) => {
  if (initialSettings) {
    return <LoadingIconBase {...props} settings={initialSettings} />;
  }
  return <LoadingIconWithHook {...props} />;
};
