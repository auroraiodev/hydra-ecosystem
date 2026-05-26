'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  date: string | Date | null | undefined;
  formatter?: (date: Date) => string;
  fallback?: string;
}

/**
 * Hydration-safe date formatter.
 * Renders fallback on the server to avoid mismatch, then hydrates with localized date on the client.
 */
export function FormattedDate({ date, formatter, fallback = '' }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    let result = fallback;
    if (date) {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (!isNaN(d.getTime())) {
          result = formatter ? formatter(d) : d.toLocaleDateString();
        }
      } catch {
        // use fallback
      }
    }
    setFormatted(result);
  }, [date, formatter, fallback]);

  // Use fallback during SSR and initial client paint to prevent mismatch
  return <>{formatted ?? fallback}</>;
}
