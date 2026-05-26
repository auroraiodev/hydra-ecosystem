import { type ReactElement, createElement } from 'react';

const PRICE_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

/**
 * Formats a numeric price into a currency string wrapped in a span with tabular-nums class.
 */
export function formatPrice(price: string | number): ReactElement {
  if (typeof price === 'number') {
    const formatted = PRICE_FORMATTER.format(isNaN(price) ? 0 : price);

    return createElement('span', { className: 'tabular-nums' }, formatted);
  }

  return createElement('span', { className: 'tabular-nums' }, price);
}
