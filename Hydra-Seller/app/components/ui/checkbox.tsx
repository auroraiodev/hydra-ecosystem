'use client';

import * as React from 'react';
import {
  Checkbox as FluentCheckbox,
  type CheckboxProps as FluentCheckboxProps,
  type CheckboxOnChangeData,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Checkbox({
  className,
  checked,
  onChange,
  onCheckedChange,
  ref,
  ...props
}: Omit<FluentCheckboxProps, 'checked'> & {
  checked?: boolean | 'mixed' | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'mixed', data: CheckboxOnChangeData) => void;
  ref?: React.Ref<HTMLInputElement>;
}) {
  // Fluent UI uses 'mixed' for indeterminate state.
  const fluentChecked = checked === 'indeterminate' ? 'mixed' : checked;

  const handleCheckedChange: FluentCheckboxProps['onChange'] = (ev, data) => {
    onChange?.(ev, data);
    onCheckedChange?.(data.checked, data);
  };

  return (
    <FluentCheckbox
      ref={ref}
      className={cn('peer', className)}
      checked={fluentChecked}
      onChange={handleCheckedChange}
      {...props}
    />
  );
}
Checkbox.displayName = 'Checkbox';

export { Checkbox };
