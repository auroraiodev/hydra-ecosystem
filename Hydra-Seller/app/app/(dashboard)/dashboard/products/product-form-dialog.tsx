'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { singlesAPI, categoriesAPI, conditionsAPI, languagesAPI } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  cardSet: string;
  rarity: string;
  price: number;
  stock: number;
  condition: string; // Display name
  condition_id?: string; // UUID
  owner: string;
  img?: string;
  importationId?: string;
  isLocalInventory?: boolean;
  language?: string; // Display name
  language_id?: string; // UUID
  category_id?: string;
  foil?: boolean;
  expansion?: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (event: unknown, data: { open: boolean }) => void;
  product?: Product | null;
  onSuccess: () => void;
  defaultCategory?: string;
}

interface MetadataItem {
  id: string;
  name: string;
  display_name?: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
  defaultCategory,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState({
    cardName: '',
    expansion: '',
    price: '',
    stock: '',
    condition_id: '',
    language_id: '',
    category_id: '',
    foil: false,
    cardSet: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<{
    conditions: MetadataItem[];
    languages: MetadataItem[];
    categories: MetadataItem[];
  }>({ conditions: [], languages: [], categories: [] });
  const { conditions, languages, categories } = metadata;

  // Fetch metadata once on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [conditionsRes, languagesRes, categoriesRes] = await Promise.all([
          conditionsAPI.list(),
          languagesAPI.list(),
          categoriesAPI.list(),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getArray = (res: any) => {
          if (Array.isArray(res)) return res;
          if (res && Array.isArray(res.data)) return res.data;
          return [];
        };

        setMetadata({
          conditions: getArray(conditionsRes),
          languages: getArray(languagesRes),
          categories: getArray(categoriesRes),
        });
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        toast.error('Failed to load form options');
      }
    };

    fetchMetadata();
  }, []);

  const handleOpenChange = (event: unknown, data: { open: boolean }) => {
    if (data.open) {
      if (product) {
        setFormData({
          cardName: product.name || '',
          expansion: product.expansion || product.cardSet || '',
          cardSet: product.cardSet || '',
          price: product.price?.toString() || '',
          stock: product.stock?.toString() || '',
          condition_id: product.condition_id || '',
          language_id: product.language_id || '',
          category_id: product.category_id || '',
          foil: product.foil || false,
        });
      } else {
        setFormData({
          cardName: '',
          expansion: '',
          cardSet: '',
          price: '',
          stock: '1',
          condition_id: '',
          language_id: '',
          category_id: defaultCategory || '',
          foil: false,
        });
      }
    }
    onOpenChange(event, data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      let owner_id = '';
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        owner_id = sessionData.user?.id || '';
      }

      if (!owner_id && !product) {
        toast.error('Could not identify current user.');
        setIsSubmitting(false);
        return;
      }

      // Construct payload
      // Note: Backend expects specific fields.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        cardName: formData.cardName,
        expansion: formData.expansion || formData.cardSet,
        finalPrice: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        condition_id: formData.condition_id,
        language_id: formData.language_id,
        category_id: formData.category_id,
        foil: formData.foil,
        // Default required fields for creation if not present
        borderless: false,
        extendedArt: false,
        prerelease: false,
        premierPlay: false,

        surgeFoil: false,
        isLocalInventory: true,
        img: product?.img || 'https://placehold.co/400x600?text=No+Image', // Placeholder if no image
        // owner_id is required
        owner_id: owner_id,
        // importationId is optional but let's leave it undefined if new
      };

      // If editing and we don't have owner_id (e.g. admin editing someone else's product),
      // the backend update endpoint might not require owner_id, or we should preserve it.
      // DTO for create requires it. Update probably merges.
      if (product) {
        // Update
        delete payload.owner_id; // Don't change owner on simple edit unless intended
        await singlesAPI.update(product.id, payload);
        toast.success('Product updated successfully');
      } else {
        // Create
        if (!payload.category_id || !payload.condition_id || !payload.language_id) {
          toast.error('Please fill all required fields (Category, Condition, Language)');
          setIsSubmitting(false);
          return;
        }
        await singlesAPI.create(payload);
        toast.success('Product created successfully');
      }

      onSuccess();
      onOpenChange(null, { open: false });
    } catch (error) {
      console.error('Submit error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save product';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Update product details. Note: Some fields like Source ID cannot be changed.'
              : 'Add a new product to your local inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardName">Card Name</Label>
            <Input
              id="cardName"
              value={formData.cardName}
              onChange={(e) => setFormData((prev) => ({ ...prev, cardName: e.target.value }))}
              placeholder="e.g. Black Lotus"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="expansion">Expansion / Set</Label>
            <Input
              id="expansion"
              value={formData.expansion}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  expansion: e.target.value,
                  cardSet: e.target.value,
                }))
              }
              placeholder="e.g. Alpha"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (MXN)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="1"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                value={formData.condition_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, condition_id: e.target.value }))}
                className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                required
              >
                <option value="">Select Condition</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={formData.language_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, language_id: e.target.value }))}
                className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
                required
              >
                <option value="">Select Language</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.display_name || l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
              className="w-full mt-1 border rounded-md p-2 text-sm bg-background"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name || c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-x-2 pt-2">
            <input
              type="checkbox"
              id="foil"
              checked={formData.foil}
              onChange={(e) => setFormData((prev) => ({ ...prev, foil: e.target.checked }))}
              className="size-4 rounded border-neutral-300"
            />
            <Label htmlFor="foil">Foil</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(null, { open: false })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
