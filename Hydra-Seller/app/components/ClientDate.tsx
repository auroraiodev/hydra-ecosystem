'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

interface ClientDateProps {
  date: string | Date;
  format?: Intl.DateTimeFormatOptions;
  formatter?: (d: Date) => string;
  fallback?: ReactNode;
}

export function ClientDate({ date, format: fmtOpts, formatter, fallback = '' }: ClientDateProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return <span suppressHydrationWarning>{fallback}</span>;
  const d = new Date(date);
  const text = formatter ? formatter(d) : d.toLocaleDateString('es-ES', fmtOpts);
  return <span suppressHydrationWarning>{text}</span>;
}
