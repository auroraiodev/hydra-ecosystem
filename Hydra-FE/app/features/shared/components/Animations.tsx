'use client';

import * as React from 'react';
import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

/* ── FadeUp ── */
interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, duration = 0.5, className = '' }: FadeUpProps) {
  const [mounted, setMounted] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  /* SSR-safe: start visible so LCP elements above-the-fold count immediately.
     Only hide if the element is truly below-the-fold after mount. */
  const isVisible = !mounted || inView;

  return (
    <div
      ref={ref}
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionProperty: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

/* ── Stagger (Container + Item) ── */
const StaggerVisibleContext = createContext(false);

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ children, className = '' }: StaggerContainerProps) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '-50px' });

  return (
    <StaggerVisibleContext.Provider value={inView}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </StaggerVisibleContext.Provider>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerItem({ children, className = '', delay = 0 }: StaggerItemProps) {
  const isVisible = React.use(StaggerVisibleContext);

  return (
    <div
      className={`transition-all duration-500 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionTimingFunction: 'cubic-bezier(0.25, 0.4, 0.25, 1)',
        transitionDelay: `${delay}s`,
        transitionProperty: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
