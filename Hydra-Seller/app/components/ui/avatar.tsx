'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Avatar as FluentAvatar,
  type AvatarProps as FluentAvatarProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/utils/imageUrl';

const AvatarContext = React.createContext<{ src?: string; name?: string }>({});

function Avatar({
  className,
  name,
  ref,
  ...props
}: FluentAvatarProps & { name?: string; ref?: React.Ref<HTMLDivElement> }) {
  const [src] = React.useState<string | undefined>(
    typeof props.image?.src === 'string' ? props.image.src : undefined
  );

  return (
    <AvatarContext.Provider value={{ src, name }}>
      <FluentAvatar {...props} ref={ref} name={name} className={cn(className)} />
    </AvatarContext.Provider>
  );
}
Avatar.displayName = 'Avatar';

function AvatarImage({
  className,
  src,
  ref,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { ref?: React.Ref<HTMLImageElement> }) {
  // Fluent UI Avatar handles image internally, but we'll keep this for compatibility if used standalone
  const resolvedSrc = resolveImageUrl(typeof src === 'string' ? src : undefined);
  return (
    <Image
      ref={ref}
      src={resolvedSrc || ''}
      alt={props.alt || ''}
      width={40}
      height={40}
      className={cn('aspect-square size-full', className)}
    />
  );
}
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  // Fluent UI Avatar handles fallback internally, but we'll render this if the context doesn't have an image
  const { src } = React.use(AvatarContext);
  if (src) return null;
  return (
    <div
      className={cn('flex size-full items-center justify-center rounded-full bg-muted', className)}
    >
      {children}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback };
