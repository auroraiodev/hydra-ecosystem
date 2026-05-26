import * as React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Apply glassmorphism Vault aesthetic */
  vault?: boolean;
  /** Apply card-hover lift effect */
  hoverable?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = ({ className, vault = false, hoverable = false, ref, ...props }: CardProps) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      vault && 'vault-glass-card border-white/10',
      hoverable && 'card-hover',
      className
    )}
    {...props}
  />
);

export const CardHeader = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

export const CardTitle = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.Ref<HTMLHeadingElement> }) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  >
    {props.children || <span className="sr-only">Card Title</span>}
  </h3>
);

export const CardDescription = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const CardContent = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
);

export const CardFooter = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
