import * as React from 'react';
import { cn } from '../../utils/cn';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  variant?: 'default' | 'primary';
  /**
   * Override the underlying element. Pass Next.js `Link` for client-side navigation:
   *   <AppLink LinkComponent={NextLink} href="/about">About</AppLink>
   */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
}

export function AppLink({
  children,
  className = '',
  active = false,
  variant = 'default',
  href,
  LinkComponent,
  ...props
}: LinkProps) {
  const Comp = (LinkComponent ?? 'a') as React.ElementType;

  return (
    <Comp
      href={href}
      className={cn(
        'transition-colors duration-200',
        variant === 'primary' || active
          ? 'text-primary font-medium hover:text-primary/80'
          : 'text-text-muted hover:text-primary',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { AppLink as Link };
