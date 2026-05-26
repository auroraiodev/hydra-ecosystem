'use client';

import { useState, useRef } from 'react';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form-field';
import type { AddProductData, Category, Language, User } from './types';

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
    name: '',
    title: '',
    description: '',
    price: 0,
    imageUrl: '',
    imageUrls: [],
    inStock: 1,
    stockStatus: 'available',
    stockNumber: '',
    tags: [],
    consignmentItem: true,
    commissionRate: 0.15,
    gameSystem: selectedTcg?.name || 'MAGIC',
    categoryId: selectedCategory?.id || '',
    category: selectedCategory?.name || '',
    expansion: '',
    languageId: '',
  });

  const prevCategoryIdRef = useRef<string | undefined>(selectedCategory?.id);

  if (selectedCategory?.id !== prevCategoryIdRef.current) {
    prevCategoryIdRef.current = selectedCategory?.id;
    setFormData((prev) => ({
      ...prev,
      categoryId: selectedCategory.id,
      category: selectedCategory.name,
    }));
  }

  // If languages are available and none selected, select the first one or English default
  const prevLanguagesRef = useRef<Language[]>(languages);
  if (languages !== prevLanguagesRef.current && languages.length > 0 && !formData.languageId) {
    prevLanguagesRef.current = languages;
    const defaultLang =
      languages.find(
        (l) => l.name.toLowerCase().includes('english') || l.name.toLowerCase().includes('inglés')
      ) || languages[0];

    if (defaultLang) {
      setFormData((prev) => ({ ...prev, languageId: defaultLang.id }));
    }
  }

  const isFormValid = () => {
    if (!selectedCategory || !selectedOwner) return false;

    return !!(
      formData.name &&
      formData.title &&
      formData.imageUrl &&
      formData.price &&
      formData.price > 0
    );
  };

  const handleAddItem = () => {
    if (!isFormValid() || !selectedCategory || !selectedOwner) {
      return;
    }

    const itemToAdd: AddProductData = {
      name: formData.name || '',
      title: formData.title || formData.name || '',
      description: formData.description,
      price: formData.price || 0,
      cost: formData.cost,
      imageUrl: formData.imageUrl || '',
      imageUrls: formData.imageUrls || [],
      inStock: formData.inStock || 1,
      stockStatus: formData.stockStatus || 'available',
      stockNumber: formData.stockNumber || undefined,
      tags: formData.tags || [],
      consignmentItem: formData.consignmentItem ?? true,
      commissionRate: selectedOwner?.productCommissionRate || formData.commissionRate || 0.15,
      gameSystem: formData.gameSystem || selectedTcg?.name || 'MAGIC',
      owner: {
        type: 'user',
        id: selectedOwner.id,
        email: selectedOwner.email,
        firstName: selectedOwner.firstName,
        lastName: selectedOwner.lastName,
        name: selectedOwner.name,
        phone: selectedOwner.phone,
      },
      categoryId: selectedCategory.id,
      category: selectedCategory.name,
      expansion: formData.expansion || '',
      languageId: formData.languageId,
    };

    onAddItem(itemToAdd);

    setFormData({
      name: '',
      title: '',
      description: '',
      price: 0,
      imageUrl: '',
      imageUrls: [],
      inStock: 1,
      stockStatus: 'available',
      stockNumber: '',
      tags: [],
      consignmentItem: true,
      commissionRate: 0.15,
      gameSystem: selectedTcg?.name || 'MAGIC',
      categoryId: selectedCategory.id,
      category: selectedCategory.name,
      expansion: '',
      languageId: formData.languageId, // Keep selected language
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Agregar Nuevo Producto</h3>
          <Button onClick={handleAddItem} disabled={!isFormValid()} variant="outline">
            <Add24Regular className="size-4 mr-2" />
            Agregar Producto
          </Button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Categoría seleccionada:</strong>{' '}
            {selectedCategory.displayName || selectedCategory.name}
          </p>
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-blue-600 dark:text-blue-400 underline mt-1"
          >
            Cambiar categoría
          </button>
        </div>

        <div className="space-y-4">
          <FormItem>
            <FormLabel htmlFor="name">Nombre del Producto *</FormLabel>
            <FormControl>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                    title: e.target.value,
                  }))
                }
                placeholder="Nombre del producto"
                className={validationErrors.name ? 'border-red-500' : ''}
              />
            </FormControl>
            {validationErrors.name && <FormMessage>{validationErrors.name}</FormMessage>}
          </FormItem>

          {/* Title field hidden as it maps to Name for manual products */}
          <div className="hidden">
            <FormItem>
              <FormLabel htmlFor="title">Título *</FormLabel>
              <FormControl>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título del producto"
                />
              </FormControl>
            </FormItem>
          </div>

          <FormItem>
            <FormLabel htmlFor="description">Descripción</FormLabel>
            <FormControl>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional"
                className="min-h-[100px]"
              />
            </FormControl>
          </FormItem>

          {selectedCategory.name === 'PRECON_DECK' && (
            <div className="p-3 bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-md text-sm text-violet-800 dark:text-violet-200">
              <strong>Tip for Precons:</strong> Please include the full deck list in the description
              field for better searchability and user information.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel htmlFor="price">Precio *</FormLabel>
              <FormControl>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={String(formData.price || 0)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                  className={validationErrors.price ? 'border-red-500' : ''}
                />
              </FormControl>
              {validationErrors.price && <FormMessage>{validationErrors.price}</FormMessage>}
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="inStock">Stock *</FormLabel>
              <FormControl>
                <Input
                  id="inStock"
                  type="number"
                  value={String(formData.inStock || 1)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      inStock: parseInt(e.target.value) || 1,
                    }))
                  }
                  placeholder="1"
                  min="0"
                />
              </FormControl>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel htmlFor="language">Idioma</FormLabel>
              <FormControl>
                <select
                  id="language"
                  value={formData.languageId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, languageId: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccionar Idioma</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.displayName || lang.name}
                    </option>
                  ))}
                </select>
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="expansion">Expansión</FormLabel>
              <FormControl>
                <Input
                  id="expansion"
                  value={formData.expansion || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expansion: e.target.value }))}
                  placeholder="Código de expansión (opcional)"
                />
              </FormControl>
            </FormItem>
          </div>

          <FormItem>
            <FormLabel htmlFor="img">URL de Imagen Principal *</FormLabel>
            <FormControl>
              <Input
                id="img"
                value={formData.imageUrl || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    imageUrl: e.target.value,
                    // If no additional images, sync first one to avoid confusion,
                    // but we generally keep them separate now.
                  }))
                }
                placeholder="https://..."
              />
            </FormControl>
          </FormItem>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Imágenes Adicionales</Label>
            {formData.imageUrls && formData.imageUrls.length > 0 && (
              <div className="space-y-3">
                {formData.imageUrls.map((url, index) => (
                  <div key={url} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const newUrls = [...(formData.imageUrls || [])];
                          newUrls[index] = e.target.value;
                          setFormData((prev) => ({ ...prev, imageUrls: newUrls }));
                        }}
                        placeholder={`URL de imagen adicional ${index + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newUrls = [...(formData.imageUrls || [])];
                        newUrls.splice(index, 1);
                        setFormData((prev) => ({ ...prev, imageUrls: newUrls }));
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <span className="sr-only">Eliminar</span>
                      <Delete24Regular className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  imageUrls: [...(prev.imageUrls || []), ''],
                }));
              }}
              className="mt-2"
            >
              <Add24Regular className="size-4 mr-2" />
              Agregar Imagen
            </Button>
          </div>

          <div className="mt-6 flex justify-end">
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
