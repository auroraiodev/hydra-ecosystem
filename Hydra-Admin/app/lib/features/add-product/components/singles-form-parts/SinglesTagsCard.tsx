import React from 'react';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Delete24Regular, Add24Regular } from '@fluentui/react-icons';

interface SinglesTagsCardProps {
  tags: string[];
  availableTags: Array<{ id: string; name: string; display_name?: string }>;
  defaultTags: string[];
  onUpdateTags: (tags: string[]) => void;
  newTagInput: string;
  onNewTagInputChange: (val: string) => void;
  isSubmitting?: boolean;
}

export function SinglesTagsCard({
  tags,
  availableTags,
  defaultTags: _defaultTags,
  onUpdateTags,
  newTagInput,
  onNewTagInputChange,
  isSubmitting = false,
}: SinglesTagsCardProps) {
  const onAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      onUpdateTags([...tags, tag]);
      onNewTagInputChange('');
    }
  };

  const onRemoveTag = (tag: string) => {
    onUpdateTags(tags.filter((t) => t !== tag));
  };

  const filteredAvailable = availableTags.filter(
    (at) => !tags.includes(at.name) && at.name.toLowerCase().includes(newTagInput.toLowerCase())
  );

  return (
    <FormItem>
      <FormLabel>Tags</FormLabel>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 py-1 px-2">
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="hover:text-destructive transition-colors"
            >
              <Delete24Regular className="size-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags added</span>}
      </div>

      <div className="flex gap-2">
        <FormControl>
          <div className="relative flex-1">
            <Input
              placeholder="Add tag..."
              value={newTagInput}
              onChange={(e) => onNewTagInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newTagInput.trim()) onAddTag(newTagInput.trim());
                }
              }}
            />
            {newTagInput && filteredAvailable.length > 0 && (
              <div className="absolute z-10 bottom-full left-0 w-full bg-popover border rounded-md shadow-md mb-1 max-h-40 overflow-y-auto">
                {filteredAvailable.map((at) => (
                  <button
                    key={at.id}
                    type="button"
                    className="w-full text-left p-2 hover:bg-accent text-sm"
                    onClick={() => onAddTag(at.name)}
                  >
                    {at.display_name || at.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormControl>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => newTagInput.trim() && onAddTag(newTagInput.trim())}
          disabled={isSubmitting}
        >
          <Add24Regular className="size-4" />
        </Button>
      </div>
    </FormItem>
  );
}
