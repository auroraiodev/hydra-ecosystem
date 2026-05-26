'use client';

import React from 'react';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import { type ProductFormData } from '../SinglesProductForm';

interface SinglesImagesProps {
  formData: Partial<ProductFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>;
  isSubmitting: boolean;
}

export function SinglesImages({ formData, setFormData, isSubmitting }: SinglesImagesProps) {
  return (
    <div className="pt-4">
      <FormItem>
        <FormLabel htmlFor="img">URL de Imagen *</FormLabel>
        <FormControl>
          <Input
            id="img"
            value={formData.img || ''}
            onChange={(e) =>
              setFormData((prev: Partial<ProductFormData>) => ({ ...prev, img: e.target.value }))
            }
            placeholder="https://..."
            disabled={isSubmitting}
          />
        </FormControl>
      </FormItem>

      <div className="space-y-4 mt-4">
        <Label className="text-sm font-medium">Imágenes Adicionales</Label>
        {formData.images && formData.images.length > 0 && (
          <div className="space-y-3">
            {formData.images.map((url: string, index: number) => (
              <div key={url} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    value={url}
                    onChange={(e) => {
                      setFormData((prev: Partial<ProductFormData>) => {
                        const newUrls = [...(prev.images || [])];
                        newUrls[index] = e.target.value;
                        return { ...prev, images: newUrls };
                      });
                    }}
                    placeholder={`URL de imagen adicional ${index + 1}`}
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFormData((prev: Partial<ProductFormData>) => {
                      const newUrls = [...(prev.images || [])];
                      newUrls.splice(index, 1);
                      return { ...prev, images: newUrls };
                    });
                  }}
                  disabled={isSubmitting}
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
            setFormData((prev: Partial<ProductFormData>) => ({
              ...prev,
              images: [...(prev.images || []), ''],
            }));
          }}
          disabled={isSubmitting}
          className="mt-2"
        >
          <Add24Regular className="size-4 mr-2" />
          Agregar Imagen Adicional
        </Button>
      </div>
    </div>
  );
}
