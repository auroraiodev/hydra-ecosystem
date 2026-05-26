import Image from 'next/image';
import { isSafeImageUrl } from '@/lib/sanitize';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { ImageProps } from 'next/image';

interface SafeImgProps extends Omit<ImageProps, 'src' | 'alt'> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export function SafeImg({ src, fallback = null, alt = '', ...props }: SafeImgProps) {
  const resolvedSrc = resolveImageUrl(src);
  if (!isSafeImageUrl(resolvedSrc)) return <>{fallback}</>;
  return <Image src={resolvedSrc} alt={alt} sizes="100vw" {...props} />;
}
