'use client';

import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  Tag24Regular,
} from '@fluentui/react-icons';
import { tagsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface Tag {
  id: string;
  name: string;
  display_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TagFormContent({
  formData, editingTag, isSubmitting,
  onChange, onCheckChange, onCancel, onSubmit,
}: {
  formData: { name: string; display_name: string; is_default: boolean; is_active: boolean };
  editingTag: Tag | null; isSubmitting: boolean;
  onChange: (field: string, value: string) => void;
  onCheckChange: (field: string, checked: boolean) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" value={formData.name} onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Commander Personal" required className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input id="display_name" value={formData.display_name}
          onChange={(e) => onChange('display_name', e.target.value)}
          placeholder="e.g., Commander Personal" className="mt-1.5" />
      </div>
      <div className="flex items-center gap-x-2">
        <Checkbox id="is_default" checked={formData.is_default}
          onCheckedChange={(_, data) => onCheckChange('is_default', data.checked === true)} />
        <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">Show as default in forms</Label>
      </div>
      <div className="flex items-center gap-x-2">
        <Checkbox id="is_active" checked={formData.is_active}
          onCheckedChange={(_, data) => onCheckChange('is_active', data.checked === true)} />
        <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">Active</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><div className="mr-2 size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Saving…</>
          ) : editingTag ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function TagsListCard({
  filteredTags, searchTerm, onEdit, onDelete,
}: {
  filteredTags: Tag[]; searchTerm: string;
  onEdit: (tag: Tag) => void; onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>{filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} found</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredTags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No tags found matching your search.' : 'No tags found.'}
          </div>
        ) : (
          <>
            <div className="block sm:hidden divide-y divide-border">
              {filteredTags.map((tag) => (
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
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(tag)}>
                        <Edit24Regular className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => onDelete(tag.id)}>
                        <Delete24Regular className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tag.is_default && <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">Default</span>}
                    {tag.is_active
                      ? <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">Active</span>
                      : <span className="text-xs bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Display Name</th>
                    <th className="text-left p-3 font-medium">Default</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => (
                    <tr key={tag.id} className="border-b hover:bg-muted/50">
                      <td className="p-3"><div className="flex items-center gap-2"><Tag24Regular className="size-4 text-muted-foreground" />{tag.name}</div></td>
                      <td className="p-3">{tag.display_name || tag.name}</td>
                      <td className="p-3">
                        {tag.is_default
                          ? <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">Default</span>
                          : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                      <td className="p-3">
                        {tag.is_active
                          ? <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">Active</span>
                          : <span className="text-xs bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 px-2 py-1 rounded">Inactive</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(tag)}><Edit24Regular className="size-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => onDelete(tag.id)} className="text-destructive hover:text-destructive"><Delete24Regular className="size-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function TagsContent() {
  const [tags, setTags] = useState<Tag[]>([]);
  const isLoading = useRef(true);

  type UiState = {
    error: string | null;
    searchTerm: string;
    isAddOpen: boolean;
    editingTag: Tag | null;
    isSubmitting: boolean;
  };
  const [uiState, dispatchUi] = useReducer(
    (s: UiState, a: Partial<UiState>): UiState => ({ ...s, ...a }),
    { error: null, searchTerm: '', isAddOpen: false, editingTag: null, isSubmitting: false }
  );
  const { error, searchTerm, isAddOpen, editingTag, isSubmitting } = uiState;

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    is_default: false,
    is_active: true,
  });

  const fetchTags = useCallback(async () => {
    isLoading.current = true;
    dispatchUi({ error: null });
    try {
      const response = await tagsAPI.list();
      let tagsArray: Tag[] = [];

      if (Array.isArray(response)) {
        tagsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        tagsArray = response.data;
      } else if (response?.success && response.data && Array.isArray(response.data)) {
        tagsArray = response.data;
      }

      setTags(tagsArray);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tags';
      dispatchUi({ error: errorMessage });
      toast.error(errorMessage);
      setTags([]);
    } finally {
      isLoading.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatchUi({ isSubmitting: true });

    try {
      if (editingTag) {
        await tagsAPI.update(editingTag.id, formData);
        toast.success('Tag updated successfully');
      } else {
        await tagsAPI.create(formData);
        toast.success('Tag created successfully');
      }
      dispatchUi({ isAddOpen: false, editingTag: null });
      setFormData({
        name: '',
        display_name: '',
        is_default: false,
        is_active: true,
      });
      void fetchTags();
    } catch (err) {
      console.error('Failed to save tag:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save tag';
      toast.error(errorMessage);
    } finally {
      dispatchUi({ isSubmitting: false });
    }
  };

  const handleEdit = (tag: Tag) => {
    dispatchUi({ editingTag: tag, isAddOpen: true });
    setFormData({
      name: tag.name,
      display_name: tag.display_name || tag.name,
      is_default: tag.is_default,
      is_active: tag.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      await tagsAPI.delete(id);
      toast.success('Tag deleted successfully');
      void fetchTags();
    } catch (err) {
      console.error('Failed to delete tag:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      toast.error(errorMessage);
    }
  };

  const handleCloseDialog = () => {
    dispatchUi({ isAddOpen: false, editingTag: null });
    setFormData({
      name: '',
      display_name: '',
      is_default: false,
      is_active: true,
    });
  };

  if (isLoading.current) {
    return (
      <PageLayout>
        <PageHeader
          title="Tags Management"
          description="Manage product tags for categorizing singles"
        />
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, n) => n).map((n) => (
                <div
                  key={`skel-${n}`}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Tags Management"
        description="Manage product tags for categorizing singles"
        action={
          <Dialog open={isAddOpen} onOpenChange={(_, data) => dispatchUi({ isAddOpen: data.open })}>
            <DialogTrigger>
              <Button onClick={() => handleCloseDialog()}>
                <Add24Regular className="size-4 mr-2" />Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTag ? 'Edit Tag' : 'Add New Tag'}</DialogTitle>
                <DialogDescription>
                  {editingTag ? 'Update the tag information below.' : 'Create a new tag for categorizing products.'}
                </DialogDescription>
              </DialogHeader>
              <TagFormContent
                formData={formData}
                editingTag={editingTag}
                isSubmitting={isSubmitting}
                onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
                onCheckChange={(field, checked) => setFormData((prev) => ({ ...prev, [field]: checked }))}
                onCancel={handleCloseDialog}
                onSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {error && <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="mb-4">
        <div className="relative">
          <Search24Regular className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search tags..." value={searchTerm}
            onChange={(e) => dispatchUi({ searchTerm: e.target.value })} className="pl-10" />
        </div>
      </div>

      <TagsListCard
        filteredTags={filteredTags}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PageLayout>
  );
}
