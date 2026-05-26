'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SpinnerIos20Regular } from '@fluentui/react-icons';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormState, Tcg } from '../types';

interface BannerFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingBannerId?: string | null;
  form: FormState;
  onFormChange: (form: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  tcgs: Tcg[];
}

export function BannerFormDialog({
  isOpen,
  onOpenChange,
  editingBannerId,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
  tcgs,
}: BannerFormDialogProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={onOpenChange}
      title={editingBannerId ? 'Edit Banner' : 'Add New Banner'}
      description="Configure the banner details for the homepage carousel."
      className="sm:max-w-[700px]"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} form="banner-form">
            {isSubmitting && <SpinnerIos20Regular className="mr-2 size-4 animate-spin" />}
            {editingBannerId ? 'Update Banner' : 'Create Banner'}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={onSubmit} className="space-y-6 py-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Find the best Magic Singles"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              placeholder="e.g. Magic Singles"
              value={form.subtitle}
              onChange={(e) => onFormChange({ ...form, subtitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Sort Order</Label>
            <Input
              id="order"
              type="number"
              value={form.order}
              onChange={(e) => onFormChange({ ...form, order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of the banner..."
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="desktop_image">Desktop Image</Label>
            <ImageUpload
              value={form.desktop_image || ''}
              onChange={(url) => onFormChange({ ...form, desktop_image: url })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="mobile_image">Mobile Image (Optional)</Label>
            <ImageUpload
              value={form.mobile_image || ''}
              onChange={(url) => onFormChange({ ...form, mobile_image: url })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_text">Button Text</Label>
            <Input
              id="button_text"
              placeholder="e.g. Explore Now"
              value={form.button_text}
              onChange={(e) => onFormChange({ ...form, button_text: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_link">Button Link</Label>
            <Input
              id="button_link"
              placeholder="e.g. /search?category=magic"
              value={form.button_link}
              onChange={(e) => onFormChange({ ...form, button_link: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Supracategory (TCG)</Label>
            <Select
              value={form.tcg_id}
              onValueChange={(value) => onFormChange({ ...form, tcg_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select TCG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Global)</SelectItem>
                {tcgs.map((tcg) => (
                  <SelectItem key={tcg.id} value={tcg.id}>
                    {tcg.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">Show this banner on the site</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => onFormChange({ ...form, is_active: checked })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
