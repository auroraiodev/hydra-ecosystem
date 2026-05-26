'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit24Regular, Delete24Regular, Tag24Regular } from '@fluentui/react-icons';

interface Tag {
  id: string;
  name: string;
  display_name?: string;
  is_default: boolean;
  is_active: boolean;
}

interface TagsMobileListProps {
  tags: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export function TagsMobileList({ tags, onEdit, onDelete }: TagsMobileListProps) {
  return (
    <div className="block sm:hidden divide-y divide-border">
      {tags.map((tag) => (
        <div key={tag.id} className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag24Regular className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{tag.name}</h3>
                {tag.display_name && tag.display_name !== tag.name && (
                  <p className="text-xs text-muted-foreground truncate">{tag.display_name}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1 ml-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onEdit(tag)}
              >
                <Edit24Regular className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(tag.id)}
              >
                <Delete24Regular className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {tag.is_default && (
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                Default
              </span>
            )}
            {tag.is_active ? (
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                Active
              </span>
            ) : (
              <span className="text-xs bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 px-2 py-0.5 rounded">
                Inactive
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
