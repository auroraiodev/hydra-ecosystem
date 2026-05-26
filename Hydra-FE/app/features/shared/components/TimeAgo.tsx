'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeAgoProps {
  date: string | Date;
}

export function TimeAgo({ date }: TimeAgoProps) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    setFormatted(
      formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: es,
      })
    );
  }, [date]);

  return <>{formatted}</>;
}
