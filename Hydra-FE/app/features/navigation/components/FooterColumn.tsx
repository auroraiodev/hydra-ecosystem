import Link from 'next/link';

import type { FooterColumnProps } from '../types';

export function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ul className="gap-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-vault-text-muted hover:text-teal transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
