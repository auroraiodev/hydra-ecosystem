'use client';

import * as React from 'react';
import {
  Input as FluentInput,
  type InputProps as FluentInputProps,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

type InputProps = FluentInputProps;

function Input({
  className,
  type,
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <FluentInput ref={ref} type={type} className={cn('w-full', className)} {...props} />;
}
Input.displayName = 'Input';

export { Input };
