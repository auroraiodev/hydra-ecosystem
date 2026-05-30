'use client';

import { useState, useReducer } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { singlesAPI } from '@/lib/api';
import { ImageUpload } from '@/components/ui/image-upload';
import { useProductMetadata } from '@/hooks/useProductMetadata';

interface Product {
  id: string;
  name: string;
  cardSet: string;
  rarity: string;
  price: number;
  stock: number;
  condition: string;
  condition_id?: string;
  owner: string;
  img?: string;
  importationId?: string;
  isLocalInventory?: boolean;
  language?: string;
  language_id?: string;
  category_id?: string;
  foil?: boolean;
  expansion?: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
  defaultCategory?: string;
}

interface FormData {
  cardName: string;
  expansion: string;
  price: string;
  stock: string;
  condition_id: string;
  language_id: string;
  category_id: string;
  foil: boolean;
  cardSet: string;
  img: string;
}

const initialFormData: FormData = {
  cardName: '', expansion: '', price: '', stock: '', condition_id: '', language_id: '', category_id: '', foil: false, cardSet: '', img: '',
};

type FormAction =
  | { type: 'SET'; data: Partial<FormData> }
  | { type: 'RESET'; defaultCategory?: string }
  | { type: 'POPULATE'; product: Product };

function formReducer(state: FormData, action: FormAction): FormData {
  switch (action.type) {
    case 'SET': return { ...state, ...action.data };
    case 'RESET': return { ...initialFormData, stock: '1', category_id: action.defaultCategory || '' };
    case 'POPULATE': {
      const p = action.product;
      return { cardName: p.name || '', expansion: p.expansion || p.cardSet || '', cardSet: p.cardSet || '', price: p.price?.toString() || '', stock: p.stock?.toString() || '', condition_id: p.condition_id || '', language_id: p.language_id || '', category_id: p.category_id || '', foil: p.foil || false, img: p.img || '' };
    }
    default: return state;
  }
}

export function ProductFormDialog({ open, onOpenChange, product, onSuccess, defaultCategory }: ProductFormDialogProps) {
  const [formData, dispatch] = useReducer(formReducer, initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { conditions, languages, categories, refresh } = useProductMetadata();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      refresh();
      if (product) dispatch({ type: 'POPULATE', product });
      else dispatch({ type: 'RESET', defaultCategory });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const sessionRes = await fetch('/auth-session', { credentials: 'include' });
      let owner_id = '';
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        owner_id = sessionData.user?.id || '';
      }

      if (!owner_id && !product) { toast.error('Usuario no identificado'); setIsSubmitting(false); return; }

      const payload: Record<string, unknown> = {
        cardName: formData.cardName,
        expansion: formData.expansion || formData.cardSet,
        finalPrice: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        condition_id: formData.condition_id,
        language_id: formData.language_id,
        category_id: formData.category_id,
        foil: formData.foil,
        borderless: false, extendedArt: false, prerelease: false, premierPlay: false, surgeFoil: false, isLocalInventory: true,
        img: formData.img || undefined,
        owner_id: owner_id,
      };

      if (product) {
        delete payload.owner_id;
        await singlesAPI.update(product.id, payload);
        toast.success('Producto actualizado');
      } else {
        if (!payload.category_id || !payload.condition_id || !payload.language_id) { toast.error('Faltan campos obligatorios'); setIsSubmitting(false); return; }
        await singlesAPI.create(payload);
        toast.success('Producto creado');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar');
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>{product ? 'Update product details.' : 'Add a new product to local inventory.'}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-2 min-h-0">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4 pb-6 pt-2">
            <div><Label htmlFor="cardName">Card Name</Label><Input id="cardName" value={formData.cardName} onChange={(e) => dispatch({ type: 'SET', data: { cardName: e.target.value } })} placeholder="e.g. Black Lotus" required className="mt-1" /></div>
            <div><Label htmlFor="expansion">Expansion / Set</Label><Input id="expansion" value={formData.expansion} onChange={(e) => dispatch({ type: 'SET', data: { expansion: e.target.value, cardSet: e.target.value } })} placeholder="e.g. Alpha" required className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="price">Price (MXN)</Label><Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => dispatch({ type: 'SET', data: { price: e.target.value } })} placeholder="0.00" required className="mt-1" /></div>
              <div><Label htmlFor="stock">Stock</Label><Input id="stock" type="number" min="0" step="1" value={formData.stock} onChange={(e) => dispatch({ type: 'SET', data: { stock: e.target.value } })} placeholder="1" required className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="condition">Condition</Label><select id="condition" value={formData.condition_id} onChange={(e) => dispatch({ type: 'SET', data: { condition_id: e.target.value } })} className="w-full mt-1 border rounded-md p-2 text-sm bg-background" required><option value="">Select</option>{conditions.map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}</select></div>
              <div><Label htmlFor="language">Language</Label><select id="language" value={formData.language_id} onChange={(e) => dispatch({ type: 'SET', data: { language_id: e.target.value } })} className="w-full mt-1 border rounded-md p-2 text-sm bg-background" required><option value="">Select</option>{languages.map((l) => <option key={l.id} value={l.id}>{l.display_name || l.name}</option>)}</select></div>
            </div>
            <div><Label htmlFor="category">Category</Label><select id="category" value={formData.category_id} onChange={(e) => dispatch({ type: 'SET', data: { category_id: e.target.value } })} className="w-full mt-1 border rounded-md p-2 text-sm bg-background" required><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}</select></div>
            <div className="flex items-center gap-x-2 pt-2"><input type="checkbox" id="foil" checked={formData.foil} onChange={(e) => dispatch({ type: 'SET', data: { foil: e.target.checked } })} className="size-4 rounded border-zinc-300" /><Label htmlFor="foil">Foil</Label></div>
            <div className="space-y-2"><Label>Product Image</Label><ImageUpload value={formData.img} onChange={(url) => dispatch({ type: 'SET', data: { img: url } })} disabled={isSubmitting} /></div>
          </form>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="product-form" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : product ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
