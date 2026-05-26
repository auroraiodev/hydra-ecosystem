'use client';

/**
 * Drop-in replacement for <img> that validates src against the image URL allowlist.
 * Renders nothing if src fails validation — prevents data: URI and unknown-origin injection.
 */
import Image from 'next/image';
import { isSafeImageUrl } from '@/lib/sanitize';

interface SafeImgProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  /** Rendered when src is absent or fails validation. Defaults to null. */
  fallback?: React.ReactNode;
}

export function SafeImg({ src, fallback = null, alt = '', width, height, ...props }: SafeImgProps) {
  if (!isSafeImageUrl(src)) return <>{fallback}</>;
  const w = width ? Number(width) : undefined;
  const h = height ? Number(height) : undefined;
  if (w && h) {
    return <Image src={src!} alt={alt} width={w} height={h} {...props} />;
  }
  return (
    <Image
      src={src!}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}
