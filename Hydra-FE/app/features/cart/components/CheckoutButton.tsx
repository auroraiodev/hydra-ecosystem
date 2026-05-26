'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CheckoutButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

const fullBounce = {
  y: [0, -20, 0, -8, 0],
  scaleX: [1, 0.95, 1.1, 0.98, 1],
  scaleY: [1, 1.08, 0.9, 1.02, 1],
};

const compactBounce = {
  scale: [1, 1.04, 0.97, 1.02, 1],
};

export function CheckoutButton({ onClick, children, className, compact = false }: CheckoutButtonProps) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(className)}
      animate={compact ? compactBounce : fullBounce}
      transition={{
        duration: 2,
        repeat: Infinity,
        times: [0, 0.2, 0.4, 0.55, 0.75],
        ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn', 'linear'],
      }}
      whileHover={compact ? { boxShadow: 'none' } : { y: 0, scaleX: 1, scaleY: 1 }}
      whileFocus={compact ? { boxShadow: 'none' } : { y: 0, scaleX: 1, scaleY: 1 }}
    >
      {children}
    </motion.div>
  );
}
