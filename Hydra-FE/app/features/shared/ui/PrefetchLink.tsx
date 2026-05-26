'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { PrefetchLink as DSPrefetchLink } from 'arcane-vault-ui';
import type { PrefetchLinkProps } from 'arcane-vault-ui';

export const PrefetchLink = ({ prefetchOnHover = true, ...props }: PrefetchLinkProps) => {
  const { prefetch } = useRouter();
  return (
    <DSPrefetchLink
      LinkComponent={NextLink as PrefetchLinkProps['LinkComponent']}
      onPrefetch={prefetchOnHover ? (href) => prefetch(href) : undefined}
      prefetchOnHover={prefetchOnHover}
      {...props}
    />
  );
};
