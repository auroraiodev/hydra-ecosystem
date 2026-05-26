import * as React from 'react';
import { VaultBadge, type VaultBadgeProps } from '../VaultBadge';

const CONDITION_MAP: Record<string, string> = {
  nm:                    'Near Mint',
  'near mint':           'Near Mint',
  'cerca de mint':       'Near Mint',
  sp:                    'Lightly Played',
  'lightly played':      'Lightly Played',
  'ligeramente jugada':  'Lightly Played',
  mp:                    'Moderately Played',
  'moderately played':   'Moderately Played',
  'moderadamente jugada':'Moderately Played',
  hp:                    'Heavily Played',
  'heavily played':      'Heavily Played',
  'muy jugada':          'Heavily Played',
  dm:                    'Damaged',
  damaged:               'Damaged',
  dañada:                'Damaged',
};

export function getConditionDisplay(condition: string | undefined): string {
  if (!condition) return '';
  const lower = condition.toLowerCase().trim();
  const mapped = CONDITION_MAP[lower];
  if (mapped) return mapped;
  for (const value of Object.values(CONDITION_MAP)) {
    if (value.toLowerCase() === lower) return value;
  }
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

export interface ConditionChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  condition: string;
  className?: string;
  variant?: VaultBadgeProps['variant'];
}

export function ConditionChip({ condition, className, variant, ...props }: ConditionChipProps) {
  if (!condition) return null;

  return (
    <VaultBadge className={className} variant={variant} {...props}>
      {getConditionDisplay(condition)}
    </VaultBadge>
  );
}
