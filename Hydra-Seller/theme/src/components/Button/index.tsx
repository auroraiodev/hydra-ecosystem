import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  text?: string;
  fullWidth?: boolean;
  showArrow?: boolean;
  simple?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export const buttonVariants = cva(
  'group/flow-button relative flex items-center justify-center gap-1 overflow-hidden rounded-[var(--radius,0.375rem)] border-0 bg-transparent font-semibold cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'text-primary hover:text-white hover:shadow-sm',
        secondary: 'text-text-muted hover:text-white',
        destructive:
          'text-destructive hover:text-white hover:shadow-sm',
        outline: 'text-text-muted hover:text-white',
        ghost:
          'border-transparent text-text-muted hover:bg-secondary hover:text-foreground',
        link:
          'border-transparent text-primary hover:underline hover:rounded-[var(--radius,0.375rem)] hover:text-white',
        'white-static': 'bg-white text-slate-900 hover:text-slate-900',
        vault:
          'text-white border-white/10 bg-white/5 backdrop-blur-sm border hover:bg-white/10',
      },
      size: {
        xs:   'px-3 py-1.5 text-xs gap-1 min-h-[28px]',
        sm:   'px-4 py-2 text-sm gap-1 min-h-[36px]',
        md:   'px-8 py-3 text-sm gap-1 min-h-[44px]',
        lg:   'px-10 py-4 text-base gap-2 min-h-[52px]',
        icon: 'h-8 w-8 p-0 gap-0 min-w-[32px] min-h-[32px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const CIRCLE_COLORS: Record<string, string> = {
  default:      'var(--primary)',
  secondary:    'var(--secondary)',
  destructive:  'var(--destructive)',
  outline:      'var(--border)',
  ghost:        'var(--muted)',
  link:         'var(--primary)',
  vault:        'var(--primary)',
  'white-static': 'var(--primary)',
};

export const Button = (
  {
    className,
    variant = 'default',
    size,
    asChild = false,
    text,
    children,
    disabled,
    fullWidth,
    showArrow = false,
    simple = false,
    ref,
    ...props
  }: ButtonProps
) => {
  const Comp = asChild ? Slot : 'button';
  const buttonText = text || children;
  const circleColor = CIRCLE_COLORS[variant ?? 'default'] ?? '#148a81';
  const isIconSize = size === 'icon';

  if (variant === 'link' || isIconSize) {
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {buttonText}
      </Comp>
    );
  }

  if (asChild) {
    const validChildren = React.Children.toArray(children).filter(React.isValidElement);
    const child = validChildren[0] as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;
    if (!child) return null;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {React.cloneElement(child, {
          className: cn(child.props.className, 'relative'),
          children: (
            <>
              <span
                className={cn(
                  'relative z-[1] transition-all duration-[800ms] ease-out flex items-center justify-center',
                  !simple && variant !== 'white-static' && 'group-hover/flow-button:text-white'
                )}
              >
                {child.props.children}
                {showArrow && <ArrowIcon variant={variant} />}
              </span>
              {!simple && <Circle color={circleColor} />}
            </>
          ),
        })}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      <span
        className={cn(
          'relative z-[1] transition-all duration-[800ms] ease-out flex items-center justify-center',
          !simple && 'group-hover/flow-button:text-white',
          showArrow ? 'gap-2' : ''
        )}
      >
        {buttonText}
        {showArrow && <ArrowIcon variant={variant} />}
      </span>
      {!simple && <Circle color={circleColor} />}
    </Comp>
  );
};

function ArrowIcon({ variant }: { variant?: string | null }) {
  return (
    <ChevronRight
      className={cn(
        'ml-1 size-4 fill-none z-[9] transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/flow-button:translate-x-1',
        variant === 'white-static'
          ? 'stroke-[#0f172a]'
          : 'stroke-primary group-hover/flow-button:stroke-white'
      )}
    />
  );
}

function Circle({ color }: { color: string }) {
  return (
    <span
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-[50%] opacity-0 group-hover/flow-button:w-[1000px] group-hover/flow-button:h-[1000px] group-hover/flow-button:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] pointer-events-none"
      style={{ backgroundColor: color }}
    />
  );
}

export { Button as FlowButton };
