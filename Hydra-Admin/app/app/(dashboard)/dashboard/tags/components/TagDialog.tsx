'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface TagFormData {
  name: string;
  display_name: string;
  is_default: boolean;
  is_active: boolean;
}

interface TagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTagId: string | null;
  formData: TagFormData;
  onFormChange: (data: Partial<TagFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function TagDialog({
  isOpen,
  onClose,
  editingTagId,
  formData,
  onFormChange,
  onSubmit,
  isSubmitting,
}: TagDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTagId ? 'Edit Tag' : 'Add New Tag'}</DialogTitle>
          <DialogDescription>
            {editingTagId
              ? 'Update the tag information below.'
              : 'Create a new tag for categorizing products.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              placeholder="e.g., Commander Personal"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => onFormChange({ display_name: e.target.value })}
              placeholder="e.g., Commander Personal"
              className="mt-1.5"
            />
          </div>
          <div className="flex items-center gap-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => onFormChange({ is_default: !!checked })}
            />
            <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
              Show as default in forms
            </Label>
          </div>
          <div className="flex items-center gap-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => onFormChange({ is_active: !!checked })}
            />
            <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
              Active
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTagId ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
