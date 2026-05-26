import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /**
   * Override the link element. Defaults to a plain <a> tag.
   * Pass Next.js `Link` here for client-side navigation:
   *   <Breadcrumbs items={items} LinkComponent={Link} />
   */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children?: React.ReactNode;
  }>;
  /** Base URL used for JSON-LD schema.org markup */
  baseUrl?: string;
}

export function Breadcrumbs({
  items,
  className,
  LinkComponent,
  baseUrl = '',
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  const LinkEl = LinkComponent ?? 'a';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href === '/' ? '' : item.href}`,
    })),
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'w-full border-b border-border-subtle bg-surface/60 backdrop-blur-sm',
        className
      )}
    >
       <script
         type="application/ld+json"
       >
         {JSON.stringify(jsonLd)}
       </script>
      <ol className="flex items-center gap-0.5 px-4 lg:px-10 max-w-[1440px] mx-auto h-9 overflow-x-auto whitespace-nowrap scrollbar-hide">
         {items.map((item, index) => (
           <li key={`breadcrumb-${item.href}`} className="flex items-center gap-0.5 shrink-0">
            {index > 0 && (
              <ChevronRight
                className="size-3.5 text-text-muted/50 mx-0.5 shrink-0"
                aria-hidden="true"
              />
            )}
            {item.current ? (
              <span
                className="text-xs font-semibold text-primary px-1.5 py-0.5 rounded-md bg-primary/8 truncate max-w-[180px]"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <LinkEl
                href={item.href}
                className="text-xs font-medium text-text-muted hover:text-text-body transition-colors px-1.5 py-0.5 rounded-md hover:bg-surface-high flex items-center gap-1 shrink-0"
              >
                {index === 0 && <Home className="size-3 shrink-0" aria-hidden="true" />}
                {item.name}
              </LinkEl>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
