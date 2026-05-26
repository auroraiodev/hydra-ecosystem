import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ParallaxImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  /**
   * Unused — kept for API compatibility with the original Next.js version.
   * The parallax effect was removed for performance.
   */
  parallaxOptions?: {
    orientation?: string;
    scale?: number;
    delay?: number;
    transition?: string;
    overflow?: boolean;
    maxTransition?: number | null;
  };
  /**
   * Drop-in replacement for the <img> element.
   * Pass Next.js `Image` here when using inside a Next.js app:
   *   <ParallaxImage ImageComponent={NextImage} src={...} alt={...} fill />
   */
  ImageComponent?: React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    [key: string]: unknown;
  }>;
}

export function ParallaxImage({
  containerClassName = '',
  className,
  parallaxOptions: _parallaxOptions,
  ImageComponent,
  ...imgProps
}: ParallaxImageProps) {
  const Img = (ImageComponent ?? 'img') as React.ElementType;

  return (
    <div className={cn('relative w-full h-full overflow-hidden', containerClassName)}>
      <Img
        {...imgProps}
        className={cn('object-cover transition-transform duration-700', className)}
        style={{
          ...imgProps.style,
          width: '100%',
          height: '100%',
          objectFit: (imgProps.style?.objectFit as React.CSSProperties['objectFit']) ?? 'cover',
        }}
      />
    </div>
  );
}
