import React from 'react';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, className = '', side = 'top' }: TooltipProps) {
  const positionClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full  top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top:    'top-full  left-1/2 -translate-x-1/2 -mt-1 border-t-gray-900 border-[4px] border-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-gray-900 border-[4px] border-transparent',
    left:   'left-full  top-1/2 -translate-y-1/2 -ml-1 border-l-gray-900 border-[4px] border-transparent',
    right:  'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-900 border-[4px] border-transparent',
  };

  return (
    <div className={cn('relative group inline-block', className)}>
      {children}
      <div
        className={cn(
          'absolute px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50',
          positionClasses[side]
        )}
      >
        {content}
        <div className={cn('absolute', arrowClasses[side])} />
      </div>
    </div>
  );
}

export { Tooltip as SimpleTooltip };
