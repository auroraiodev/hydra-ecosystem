'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';
import { TcgCategoryTabs } from '@/features/search-filters';
import { FadeUp } from '@/features/shared/components/Animations';
import { getCategoryDisplay } from '../utils';

interface SearchBreadcrumbsProps {
  currentTcg: { name: string; display_name: string };
  categoryParam?: string;
}

export function SearchBreadcrumbs({ currentTcg, categoryParam }: SearchBreadcrumbsProps) {
  return (
    <div className="relative z-10 px-4 lg:px-8 lg:max-w-7xl lg:mx-auto pt-4 lg:pt-6">
      <FadeUp>
        <nav className="lg:px-0" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-vault-text-muted">
            <li>
              <Link href="/" className="hover:text-teal transition-colors">
                Inicio
              </Link>
            </li>
            <ChevronRight className="size-3" />
            <li>
              <Link
                href={`/${tcgNameToSlug(currentTcg.name)}`}
                className="hover:text-teal transition-colors"
              >
                {currentTcg.display_name || currentTcg.name}
              </Link>
            </li>
            <ChevronRight className="size-3" />
            <li className="text-white font-medium">
              {categoryParam ? getCategoryDisplay(categoryParam) : 'Singles'}
            </li>
          </ol>
        </nav>
      </FadeUp>

      <FadeUp delay={0.05}>
        <div className="lg:px-0 pt-4">
          <TcgCategoryTabs variant="vault" />
        </div>
      </FadeUp>
    </div>
  );
}
