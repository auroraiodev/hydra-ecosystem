'use client';

import { useEffect, useRef, useReducer, Suspense, useId, useState } from 'react';
import { useSearchParams, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { getActiveCategories, type Category } from '@/lib/api';
import { useAppSelector } from '@/lib/store/hooks';
import { Skeleton } from '@/features/shared/ui/skeleton';
import { cn } from '@/lib/utils';
import { CATEGORY_NAME_MAP, CATEGORY_TO_PATH, PATH_TO_CATEGORY } from '../constants';
import { tcgNameToSlug } from '@/lib/utils/tcgSlug';

interface TcgCategoryTabsProps {
  variant?: 'vault' | 'default';
  className?: string;
}

export function TcgCategoryTabs({ variant = 'default', className }: TcgCategoryTabsProps) {
  return (
    <Suspense fallback={null}>
      <TcgCategoryTabsInner variant={variant} className={className} />
    </Suspense>
  );
}

interface CatState {
  categories: Array<{ id: string; label: string }>;
  isLoading: boolean;
}

type CatAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Array<{ id: string; label: string }> }
  | { type: 'FETCH_ERROR' };

function catReducer(state: CatState, action: CatAction): CatState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return { categories: action.payload, isLoading: false };
    case 'FETCH_ERROR':
      return {
        categories: [
          { id: 'all', label: 'Todos' },
          { id: 'singles', label: 'Singles' },
        ],
        isLoading: false,
      };
    default:
      return state;
  }
}

function TcgCategoryTabsInner({ variant = 'default', className }: TcgCategoryTabsProps) {
  const skeletonId = useId();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const routeParams = useParams();
  const { selectedTcg } = useAppSelector((state) => state.game);

  const [catState, catDispatch] = useReducer(catReducer, {
    categories: [],
    isLoading: true,
  });
  const { categories, isLoading } = catState;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive active category from URL path segment or query param
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathSection = pathSegments[1] || null;
  const paramCategory = searchParams.get('category');
  const activeCategory =
    paramCategory || (pathSection ? (PATH_TO_CATEGORY[pathSection] ?? pathSection) : null) || 'all';

  const fetchedForId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const tcgId = selectedTcg?.id;
    if (!tcgId || fetchedForId.current === tcgId) return;
    fetchedForId.current = tcgId;

    async function fetchCategories() {
      try {
        catDispatch({ type: 'FETCH_START' });
        const categoriesData = await getActiveCategories(tcgId);

        const mappedCategories = [
          { id: 'all', label: 'Todos' },
          ...categoriesData.map((cat: Category) => ({
            id: CATEGORY_NAME_MAP[cat.name.toUpperCase()] || cat.name.toLowerCase(),
            label: cat.display_name || cat.name,
          })),
        ];

        // Remove duplicates
        const uniqueCategories = mappedCategories.filter(
          (cat, index, self) => index === self.findIndex((c) => c.id === cat.id)
        );

        catDispatch({ type: 'FETCH_SUCCESS', payload: uniqueCategories });
      } catch (error) {
        console.error('Error fetching categories:', error);
        catDispatch({ type: 'FETCH_ERROR' });
      }
    }

    fetchCategories();
  }, [selectedTcg?.id]);

  if (!mounted || !selectedTcg) return null;

  if (isLoading) {
    const isVault = variant === 'vault';
    return (
      <div className={cn('w-full overflow-x-auto no-scrollbar py-1', className)}>
        <div className="flex gap-2 min-w-max">
          {[1, 2, 3, 4].map((num) => (
            <Skeleton
              key={`${skeletonId}-tab-${num}`}
              className="h-9 w-24 rounded-lg"
              vault={isVault}
            />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const tcgSlug = tcgNameToSlug((routeParams?.tcg as string) || selectedTcg.name);

  return (
    <div className={cn('w-full overflow-x-auto no-scrollbar py-1', className)}>
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          let href: string;
          if (category.id === 'all') {
            href = `/${tcgSlug}`;
          } else if (category.id === 'singles') {
            href = `/${tcgSlug}/singles/search?local=true&pagination=true`;
          } else if (CATEGORY_TO_PATH[category.id]) {
            const path = CATEGORY_TO_PATH[category.id];
            href = `/${tcgSlug}/${path}/search?local=true&pagination=true`;
          } else {
            href = `/${tcgSlug}/${category.id.toLowerCase()}/search?local=true&pagination=true`;
          }

          if (variant === 'vault') {
            return (
              <Link
                key={category.id}
                href={href}
                className={cn(
                  'shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  isActive
                    ? 'bg-teal text-teal-foreground'
                    : 'vault-glass-card text-vault-text-muted hover:text-white'
                )}
              >
                {category.label}
              </Link>
            );
          }

          return (
            <Link
              key={category.id}
              href={href}
              className={cn(
                'shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900'
              )}
            >
              {category.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
