'use client';

import { useRef, useState } from 'react';
import { Add24Regular } from '@fluentui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AddProductData, Category, Language, User } from './types';
import { AdditionalImages } from './components/AdditionalImages';
import { GenericFormFields } from './components/GenericFormFields';

const EMPTY_LANGUAGES: Language[] = [];

interface GenericProductFormProps {
  selectedCategory: Category;
  selectedOwner: User;
  validationErrors: Record<string, string>;
  onAddItem: (item: AddProductData) => void;
  onSelectCategory: (category: Category | null) => void;
  languages?: Language[];
  selectedTcg?: import('./types').Tcg | null;
}

export function GenericProductForm({
  selectedCategory,
  selectedOwner,
  validationErrors,
  onAddItem,
  onSelectCategory,
  languages = EMPTY_LANGUAGES,
  selectedTcg,
}: GenericProductFormProps) {
  const [formData, setFormData] = useState<Partial<AddProductData>>({
    name: '', title: '', description: '', price: 0, imageUrl: '', imageUrls: [],
    inStock: 1, stockStatus: 'available', stockNumber: '', tags: [],
    consignmentItem: true, commissionRate: 0.15,
    gameSystem: selectedTcg?.name || 'MAGIC',
    categoryId: selectedCategory?.id || '', category: selectedCategory?.name || '',
    expansion: '', languageId: '',
  });

  const prevCategoryId = useRef<string | undefined>(selectedCategory?.id);
  if (selectedCategory?.id !== prevCategoryId.current) {
    prevCategoryId.current = selectedCategory?.id;
    setFormData((prev) => ({ ...prev, categoryId: selectedCategory.id, category: selectedCategory.name }));
  }

  const prevLanguagesRef = useRef<Language[]>(languages);
  if (languages !== prevLanguagesRef.current && languages.length > 0 && !formData.languageId) {
    prevLanguagesRef.current = languages;
    const defaultLang = languages.find(l => 
      l.name.toLowerCase().includes('english') || l.name.toLowerCase().includes('inglés')
    ) || languages[0];
    if (defaultLang) setFormData((prev) => ({ ...prev, languageId: defaultLang.id }));
  }

  const isFormValid = () => {
    if (!selectedCategory || !selectedOwner) return false;
    return !!(formData.name && formData.title && formData.imageUrl && formData.price && formData.price > 0);
  };

  const handleAddItem = () => {
    if (!isFormValid() || !selectedCategory || !selectedOwner) return;

    const itemToAdd: AddProductData = {
      name: formData.name || '', title: formData.title || formData.name || '',
      description: formData.description, price: formData.price || 0, cost: formData.cost,
      imageUrl: formData.imageUrl || '', imageUrls: formData.imageUrls || [],
      inStock: formData.inStock || 1, stockStatus: formData.stockStatus || 'available',
      stockNumber: formData.stockNumber || undefined, tags: formData.tags || [],
      consignmentItem: formData.consignmentItem ?? true,
      commissionRate: selectedOwner?.productCommissionRate || formData.commissionRate || 0.15,
      gameSystem: formData.gameSystem || selectedTcg?.name || 'MAGIC',
      owner: {
        type: 'user', id: selectedOwner.id, email: selectedOwner.email,
        firstName: selectedOwner.firstName, lastName: selectedOwner.lastName,
        name: selectedOwner.name, phone: selectedOwner.phone,
      },
      categoryId: selectedCategory.id, category: selectedCategory.name,
      expansion: formData.expansion || '', languageId: formData.languageId,
    };

    onAddItem(itemToAdd);

    setFormData({
      name: '', title: '', description: '', price: 0, imageUrl: '', imageUrls: [],
      inStock: 1, stockStatus: 'available', stockNumber: '', tags: [],
      consignmentItem: true, commissionRate: 0.15,
      gameSystem: selectedTcg?.name || 'MAGIC',
      categoryId: selectedCategory.id, category: selectedCategory.name,
      expansion: '', languageId: formData.languageId,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Agregar Nuevo Producto</h3>
          <Button onClick={handleAddItem} disabled={!isFormValid()} variant="outline">
            <Add24Regular className="size-4 mr-2" />
            Agregar Producto
          </Button>
        </div>

        <div className="mb-6 p-4 bg-primary/[0.03] border border-primary/5 rounded-xl">
          <p className="text-sm">
            <strong className="text-muted-foreground uppercase text-[10px] tracking-widest mr-2">
              Categoría:
            </strong>{' '}
            <span className="font-semibold">{selectedCategory.displayName || selectedCategory.name}</span>
          </p>
          <button
            onClick={() => onSelectCategory(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline mt-2"
          >
            Cambiar categoría
          </button>
        </div>

        <div className="space-y-6">
          <GenericFormFields
            formData={formData}
            onFormChange={(f) => setFormData((prev) => ({ ...prev, ...f }))}
            validationErrors={validationErrors}
            languages={languages}
            selectedCategory={selectedCategory}
          />

          <AdditionalImages
            imageUrls={formData.imageUrls || []}
            onChange={(urls) => setFormData((prev) => ({ ...prev, imageUrls: urls }))}
          />

          <div className="mt-8 flex justify-end">
            <Button onClick={handleAddItem} disabled={!isFormValid()} variant="outline">
              <Add24Regular className="size-4 mr-2" />
              Agregar Producto
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
