import * as React from 'react';
import { cn } from '../../utils/cn';

export interface VaultBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'gold' | 'purple' | 'teal' | 'blue' | 'orange' | 'red';
  outline?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
}

const variantClasses: Record<NonNullable<VaultBadgeProps['variant']>, string> = {
  default: 'bg-white/5 border-white/10 text-vault-text-muted',
  primary: 'bg-primary/10 border-primary/20 text-primary',
  gold:    'bg-gold/10 border-gold/20 text-gold',
  purple:  'bg-purple-500/10 border-purple-500/20 text-purple-300',
  teal:    'bg-teal-500/10 border-teal-500/20 text-teal-300',
  blue:    'bg-blue-500/10 border-blue-500/20 text-blue-300',
  orange:  'bg-orange-500/10 border-orange-500/20 text-orange-400',
  red:     'bg-red-500/10 border-red-500/20 text-red-400',
};

export function VaultBadge({
  children,
  className,
  variant = 'default',
  outline = true,
  uppercase = false,
  capitalize: capitalizeProp = false,
  ...props
}: VaultBadgeProps) {
  const transformText = (text: React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') return text;
    if (uppercase) return text.toUpperCase();
    if (capitalizeProp) return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    return text;
  };

  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-tight',
        outline && 'border',
        uppercase && 'uppercase',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {transformText(children)}
    </span>
  );
}
