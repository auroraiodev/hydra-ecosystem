'use client';

import * as React from 'react';
import {
  Textarea as FluentTextarea,
  type TextareaProps as FluentTextareaProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: FluentTextareaProps) {
  return <FluentTextarea className={cn('w-full', className)} {...props} />;
}

export { Textarea };
