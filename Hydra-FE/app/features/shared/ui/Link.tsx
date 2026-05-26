'use client';

import NextLink from 'next/link';
import { AppLink } from 'arcane-vault-ui';
import type { LinkProps } from 'arcane-vault-ui';

export function Link(props: LinkProps) {
  return <AppLink LinkComponent={NextLink as LinkProps['LinkComponent']} {...props} />;
}
