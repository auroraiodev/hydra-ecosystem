'use client';

import * as React from 'react';
import {
  Switch as FluentSwitch,
  type SwitchProps as FluentSwitchProps,
  type SwitchOnChangeData,
} from '@fluentui/react-components';
import { cn } from '@/lib/utils';

function Switch({
  className,
  checked,
  onChange,
  onCheckedChange,
  ref,
  ...props
}: FluentSwitchProps & {
  onCheckedChange?: (checked: boolean, data: SwitchOnChangeData) => void;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const handleCheckedChange: FluentSwitchProps['onChange'] = (ev, data) => {
    onChange?.(ev, data);
    onCheckedChange?.(data.checked, data);
  };

  return (
    <FluentSwitch
      ref={ref}
      className={cn('peer', className)}
      checked={checked}
      onChange={handleCheckedChange}
      {...props}
    />
  );
}
Switch.displayName = 'Switch';

export { Switch };
