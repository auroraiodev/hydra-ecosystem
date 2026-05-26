import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductsCategoryTabsProps {
  activeTab: string;
  categories: { id: string; name: string; display_name?: string }[];
  onTabChange: (tab: string) => void;
}

export function ProductsCategoryTabs({
  activeTab,
  categories,
  onTabChange,
}: ProductsCategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <Button
        variant={activeTab === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('all')}
        className={cn(
          'px-4 rounded-full text-[10px] font-bold uppercase tracking-widest',
          activeTab !== 'all' && 'text-muted-foreground'
        )}
      >
        Todos
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeTab === cat.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange(cat.id)}
          className={cn(
            'px-4 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
            activeTab !== cat.id && 'text-muted-foreground'
          )}
        >
          {cat.display_name || cat.name}
        </Button>
      ))}
    </div>
  );
}
