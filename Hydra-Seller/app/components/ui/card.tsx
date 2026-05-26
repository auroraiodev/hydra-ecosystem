'use client';

import * as React from 'react';
import {
  Card as FluentCard,
  CardHeader as FluentCardHeader,
  type CardProps as FluentCardProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'> & FluentCardProps) {
  return (
    <FluentCard
      data-slot="card"
      className={cn('transition-all duration-300', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <FluentCardHeader data-slot="card-header" className={cn('px-6', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6 py-4', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
