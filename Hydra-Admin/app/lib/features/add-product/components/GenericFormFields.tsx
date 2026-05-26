'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form-field';
import type { AddProductData, Category, Language } from '../types';

interface GenericFormFieldsProps {
  formData: Partial<AddProductData>;
  onFormChange: (form: Partial<AddProductData>) => void;
  validationErrors: Record<string, string>;
  languages: Language[];
  selectedCategory: Category;
}

export function GenericFormFields({
  formData,
  onFormChange,
  validationErrors,
  languages,
  selectedCategory,
}: GenericFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel htmlFor="name">Nombre del Producto *</FormLabel>
        <FormControl>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) =>
              onFormChange({
                name: e.target.value,
                title: e.target.value,
              })
            }
            placeholder="Nombre del producto"
            className={validationErrors.name ? 'border-red-500' : ''}
          />
        </FormControl>
        {validationErrors.name && <FormMessage>{validationErrors.name}</FormMessage>}
      </FormItem>

      <FormItem>
        <FormLabel htmlFor="description">Descripción</FormLabel>
        <FormControl>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => onFormChange({ description: e.target.value })}
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
              value={formData.price || 0}
              onChange={(e) =>
                onFormChange({
                  price: parseFloat(e.target.value) || 0,
                })
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
              value={formData.inStock || 1}
              onChange={(e) =>
                onFormChange({
                  inStock: parseInt(e.target.value) || 1,
                })
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
              onChange={(e) => onFormChange({ languageId: e.target.value })}
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
              onChange={(e) => onFormChange({ expansion: e.target.value })}
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
              onFormChange({
                imageUrl: e.target.value,
              })
            }
            placeholder="https://..."
          />
        </FormControl>
      </FormItem>
    </div>
  );
}
