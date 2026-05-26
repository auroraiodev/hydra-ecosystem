---
name: new-page
description: Scaffold a new CRUD management page for the hydra-admin-dashboard. Use when adding a new resource management section — creates the page.tsx + content.tsx pair with full CRUD UI (table, dialog form, search, toast feedback, sidebar nav) following the admin patterns.
disable-model-invocation: true
---

Create a new admin management page: $ARGUMENTS

## Context

- Existing pages: !`ls app/\(dashboard\)/dashboard/`
- Available APIs in lib/api.ts: !`grep "export const" lib/api.ts`
- Sidebar nav items: !`grep -A 3 "navItems" components/sidebar.tsx | head -30`

## Steps

1. **Create directory:** `app/(dashboard)/dashboard/<resource>/`

2. **Create `page.tsx`** (server component, metadata only):

```tsx
import type { Metadata } from 'next';
import ResourceContent from './resource-content';

export const metadata: Metadata = {
  title: 'Resource Management - Hydra Admin',
  description: 'Manage resources',
};

export default function ResourcePage() {
  return <ResourceContent />;
}
```

3. **Create `resource-content.tsx`** (full CRUD client component):

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/ui/page-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { resourceAPI } from '@/lib/api';

interface Item {
  id: string;
  name: string;
  // ... fields
}

export default function ResourceContent() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '' });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await resourceAPI.list();
      const data = response?.data || response || [];
      setItems(data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };
  const openEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await resourceAPI.update(editingItem.id, formData);
        toast.success('Item updated');
      } else {
        await resourceAPI.create(formData);
        toast.success('Item created');
      }
      setIsDialogOpen(false);
      void fetchItems();
    } catch {
      toast.error(editingItem ? 'Failed to update' : 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await resourceAPI.delete(id);
      toast.success('Item deleted');
      void fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageLayout>
      <PageHeader
        title="Resource Management"
        description="Manage your resources"
        action={<Button onClick={openCreate}>Add New</Button>}
      />

      <div className="mb-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>{filtered.length} items found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="block sm:hidden divide-y">
                {filtered.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Name</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                              Delete
                            </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add New'} Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
```

4. **Add API** — If no matching API object exists in `lib/api.ts`, add it now (see `/new-api`).

5. **Add sidebar nav** — In `components/sidebar.tsx`, add to `navItems`:

```ts
import { IconName } from 'lucide-react';
{ href: "/dashboard/resource", label: "Resource", icon: IconName },
```

6. **Report** — Files created, API used, and sidebar change made.
