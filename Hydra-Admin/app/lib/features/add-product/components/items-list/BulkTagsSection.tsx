'use client';

import React from 'react';
import { Tag24Regular, Add24Regular } from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BulkTagsSectionProps {
  bulkTags: string[];
  newBulkTagInput: string;
  defaultTags: string[];
  isLoadingTags: boolean;
  onBulkTagsChange: (tags: string[]) => void;
  onNewTagInputChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onApply: () => void;
}

export function BulkTagsSection({
  bulkTags,
  newBulkTagInput,
  defaultTags,
  isLoadingTags,
  onBulkTagsChange,
  onNewTagInputChange,
  onAddTag,
  onRemoveTag,
  onApply,
}: BulkTagsSectionProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border">
      <Label className="text-base font-medium mb-3 flex items-center gap-2">
        <Tag24Regular className="size-4" />
        Agregar Etiquetas a Todos los Productos
      </Label>

      {!isLoadingTags && defaultTags.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          {defaultTags.map((tag) => (
            <label key={tag} className="flex items-center gap-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkTags.includes(tag)}
                onChange={(e) => {
                  const newTags = e.target.checked
                    ? [...bulkTags, tag]
                    : bulkTags.filter((t) => t !== tag);
                  onBulkTagsChange(newTags);
                }}
                className="rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{tag}</span>
            </label>
          ))}
        </div>
      )}

      {bulkTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {bulkTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-1 hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <Input
          value={newBulkTagInput}
          onChange={(e) => onNewTagInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newBulkTagInput.trim() && !bulkTags.includes(newBulkTagInput.trim())) {
              e.preventDefault();
              onAddTag(newBulkTagInput.trim());
              onNewTagInputChange('');
            }
          }}
          placeholder="Agregar nueva etiqueta (presiona Enter)"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (newBulkTagInput.trim() && !bulkTags.includes(newBulkTagInput.trim())) {
              onAddTag(newBulkTagInput.trim());
              onNewTagInputChange('');
            }
          }}
        >
          <Add24Regular className="size-4" />
        </Button>
      </div>

      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={onApply}
        disabled={bulkTags.length === 0}
        className="w-full"
      >
        <Tag24Regular className="size-4 mr-2" />
        Aplicar {bulkTags.length > 0 ? `${bulkTags.length} ` : ''}
        Etiqueta{bulkTags.length !== 1 ? 's' : ''} a Todos los Productos
      </Button>
    </div>
  );
}
