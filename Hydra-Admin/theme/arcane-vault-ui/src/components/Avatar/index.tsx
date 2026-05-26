'use client';
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>;
}

const Avatar = ({ className, size, ref, ...props }: AvatarProps) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
);

const AvatarImage = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>>;
}) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
);

const AvatarFallback = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>>;
}) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-surface-low font-medium text-text-muted',
      className
    )}
    {...props}
  />
);

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
