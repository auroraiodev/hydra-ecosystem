'use client';

import * as React from 'react';
import {
  Badge as FluentBadge,
  type BadgeProps as FluentBadgeProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

interface BadgeProps extends FluentBadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', appearance, ...props }: BadgeProps) {
  // Map shadcn variant to Fluent appearance/color
  const fluentAppearance = (() => {
    switch (variant) {
      case 'default':
        return 'filled';
      case 'secondary':
        return 'tint';
      case 'outline':
        return 'outline';
      case 'destructive':
        return 'filled';
      default:
        return 'filled';
    }
  })();

  const color = variant === 'destructive' ? 'danger' : undefined;

  return (
    <FluentBadge
      className={cn(className)}
      appearance={appearance || fluentAppearance}
      color={color}
      {...props}
    />
  );
}

export { Badge };
