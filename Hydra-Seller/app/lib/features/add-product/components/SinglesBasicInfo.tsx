'use client';

import React from 'react';
import { Add24Regular } from '@fluentui/react-icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import type { Condition, Language } from '../types';
import { type ProductFormData } from '../SinglesProductForm';

interface SinglesBasicInfoProps {
  formData: Partial<ProductFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  conditions: Condition[];
  isLoadingConditions: boolean;
  languages: Language[];
  isLoadingLanguages: boolean;
  defaultTags: string[];
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  formConfig?: {
    fields: Record<string, { enabled: boolean; label?: string }>;
  };
}

export function SinglesBasicInfo({
  formData,
  setFormData,
  validationErrors,
  isSubmitting,
  conditions,
  isLoadingConditions,
  languages,
  isLoadingLanguages,
  defaultTags,
  newTagInput,
  setNewTagInput,
  formConfig,
}: SinglesBasicInfoProps) {
  const isFieldEnabled = (fieldId: string) => {
    if (!formConfig) return true;
    return formConfig.fields?.[fieldId]?.enabled ?? true;
  };
  return (
    <div className="space-y-4 pt-4">
      <FormItem>
        <FormLabel htmlFor="cardName" className="text-base font-medium">
          Nombre de la Carta *
        </FormLabel>
        <FormControl>
          <Input
            id="cardName"
            value={formData.cardName || ''}
            onChange={(e) =>
              setFormData((prev: Partial<ProductFormData>) => ({
                ...prev,
                cardName: e.target.value,
              }))
            }
            placeholder="Ej: Ral, Storm Conduit"
            disabled={isSubmitting}
            className={cn(
              'mt-2',
              validationErrors.cardName || validationErrors.name ? 'border-red-500' : ''
            )}
          />
        </FormControl>
        {(validationErrors.cardName || validationErrors.name) && (
          <FormMessage>{validationErrors.cardName || validationErrors.name}</FormMessage>
        )}
      </FormItem>

      <div className="grid grid-cols-2 gap-4">
        <FormItem>
          <FormLabel htmlFor="finalPrice">Precio Final *</FormLabel>
          <FormControl>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
              value={String(formData.finalPrice || 0)}
              onChange={(e) =>
                setFormData((prev: Partial<ProductFormData>) => ({
                  ...prev,
                  finalPrice: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0.00"
              disabled={isSubmitting}
              className={
                validationErrors.finalPrice || validationErrors.price ? 'border-red-500' : ''
              }
            />
          </FormControl>
          {(validationErrors.finalPrice || validationErrors.price) && (
            <FormMessage>{validationErrors.finalPrice || validationErrors.price}</FormMessage>
          )}
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="inStock">Stock *</FormLabel>
          <FormControl>
            <Input
              id="inStock"
              type="number"
              value={String(formData.stock || 1)}
              onChange={(e) =>
                setFormData((prev: Partial<ProductFormData>) => ({
                  ...prev,
                  stock: parseInt(e.target.value) || 1,
                }))
              }
              placeholder="1"
              min="0"
              disabled={isSubmitting}
            />
          </FormControl>
        </FormItem>
      </div>

      {isFieldEnabled('tags') && (
        <FormItem>
          <FormLabel>Etiquetas</FormLabel>
          <FormControl>
            <div>
              <div className="grid sm:grid-cols-2 gap-3 mt-2 mb-4">
                {defaultTags.map((tag) => (
                  <label key={tag} className="flex items-center gap-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags?.includes(tag) || false}
                      onChange={(e) => {
                        const currentTags = formData.tags || [];
                        const newTags = e.target.checked
                          ? [...currentTags, tag]
                          : currentTags.filter((t: string) => t !== tag);
                        setFormData((prev: Partial<ProductFormData>) => ({
                          ...prev,
                          tags: newTags,
                        }));
                      }}
                      disabled={isSubmitting}
                      className="rounded border-zinc-300 dark:border-zinc-700 focus:ring-primary/20"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{tag}</span>
                  </label>
                ))}
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 rounded-md border border-sky-200 dark:border-sky-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = formData.tags?.filter((t: string) => t !== tag) || [];
                          setFormData((prev: Partial<ProductFormData>) => ({
                            ...prev,
                            tags: newTags,
                          }));
                        }}
                        disabled={isSubmitting}
                        className="ml-1 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTagInput.trim() && !isSubmitting) {
                      e.preventDefault();
                      const currentTags = formData.tags || [];
                      if (!currentTags.includes(newTagInput.trim())) {
                        setFormData((prev: Partial<ProductFormData>) => ({
                          ...prev,
                          tags: [...currentTags, newTagInput.trim()],
                        }));
                        setNewTagInput('');
                      }
                    }
                  }}
                  placeholder="Agregar nueva etiqueta (presiona Enter)"
                  className="flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newTagInput.trim() && !isSubmitting) {
                      const currentTags = formData.tags || [];
                      if (!currentTags.includes(newTagInput.trim())) {
                        setFormData((prev: Partial<ProductFormData>) => ({
                          ...prev,
                          tags: [...currentTags, newTagInput.trim()],
                        }));
                        setNewTagInput('');
                      }
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <Add24Regular className="size-4" />
                </Button>
              </div>
            </div>
          </FormControl>
        </FormItem>
      )}

      <div className="grid grid-cols-2 gap-4">
        {isFieldEnabled('condition') && (
          <FormItem>
            <FormLabel htmlFor="conditionId">Condición *</FormLabel>
            <FormControl>
              <Select
                value={formData.condition_id || ''}
                onValueChange={(value) =>
                  setFormData((prev: Partial<ProductFormData>) => ({
                    ...prev,
                    condition_id: value,
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingConditions ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground italic">
                      Cargando condiciones…
                    </div>
                  ) : conditions.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay condiciones disponibles
                    </div>
                  ) : (
                    conditions.reduce<React.ReactNode[]>((acc, condition, index) => {
                      if (condition.id && condition.id.trim() !== '') {
                        acc.push(
                          <SelectItem
                            key={condition.id || `condition-${index}`}
                            value={condition.id!}
                          >
                            {condition.displayName || condition.name}
                          </SelectItem>
                        );
                      }
                      return acc;
                    }, [])
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            {(validationErrors.condition_id || validationErrors.conditionId) && (
              <FormMessage>
                {validationErrors.condition_id || validationErrors.conditionId}
              </FormMessage>
            )}
          </FormItem>
        )}

        {isFieldEnabled('language') && (
          <FormItem>
            <FormLabel htmlFor="languageId">Idioma *</FormLabel>
            <FormControl>
              <Select
                value={formData.language_id || ''}
                onValueChange={(value) =>
                  setFormData((prev: Partial<ProductFormData>) => ({ ...prev, language_id: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingLanguages ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground italic">
                      Cargando idiomas…
                    </div>
                  ) : languages.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay idiomas disponibles
                    </div>
                  ) : (
                    languages.reduce<React.ReactNode[]>((acc, language) => {
                      if (language.id) {
                        acc.push(
                          <SelectItem key={language.id} value={language.id!}>
                            {language.displayName || language.name}
                          </SelectItem>
                        );
                      }
                      return acc;
                    }, [])
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            {(validationErrors.language_id || validationErrors.languageId) && (
              <FormMessage>
                {validationErrors.language_id || validationErrors.languageId}
              </FormMessage>
            )}
          </FormItem>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isFieldEnabled('expansion') && (
          <FormItem>
            <FormLabel htmlFor="expansion">Expansión</FormLabel>
            <FormControl>
              <Input
                id="expansion"
                value={formData.expansion || ''}
                onChange={(e) =>
                  setFormData((prev: Partial<ProductFormData>) => ({
                    ...prev,
                    expansion: e.target.value,
                  }))
                }
                placeholder="Ej: LTR, M21"
                disabled={isSubmitting}
              />
            </FormControl>
          </FormItem>
        )}

        {isFieldEnabled('cardNumber') && (
          <FormItem>
            <FormLabel htmlFor="cardNumber">Número de Carta</FormLabel>
            <FormControl>
              <Input
                id="cardNumber"
                value={formData.cardNumber || ''}
                onChange={(e) =>
                  setFormData((prev: Partial<ProductFormData>) => ({
                    ...prev,
                    cardNumber: e.target.value,
                  }))
                }
                placeholder="Ej: 451"
                disabled={isSubmitting}
              />
            </FormControl>
          </FormItem>
        )}
      </div>

      {isFieldEnabled('variant') && (
        <FormItem>
          <FormLabel htmlFor="variant">Variante</FormLabel>
          <FormControl>
            <Input
              id="variant"
              value={formData.variant || ''}
              onChange={(e) =>
                setFormData((prev: Partial<ProductFormData>) => ({
                  ...prev,
                  variant: e.target.value || undefined,
                }))
              }
              placeholder="Ej: The List, Showcase, etc."
              disabled={isSubmitting}
            />
          </FormControl>
        </FormItem>
      )}

      {(isFieldEnabled('foil') ||
        isFieldEnabled('borderless') ||
        isFieldEnabled('extendedArt') ||
        isFieldEnabled('surgeFoil') ||
        isFieldEnabled('prerelease') ||
        isFieldEnabled('premierPlay')) && (
        <div>
          <Label>Características Especiales</Label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {['foil', 'borderless', 'extendedArt', 'surgeFoil', 'prerelease', 'premierPlay'].map(
              (feat) => {
                if (!isFieldEnabled(feat)) return null;
                const labels: Record<string, string> = {
                  foil: 'Foil',
                  borderless: 'Borderless',
                  extendedArt: 'Extended Art',
                  surgeFoil: 'Surge Foil',
                  prerelease: 'Prerelease',
                  premierPlay: 'Premier Play',
                };
                return (
                  <label key={feat} className="flex items-center gap-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[feat] || false}
                      onChange={(e) =>
                        setFormData((prev: Partial<ProductFormData>) => ({
                          ...prev,
                          [feat]: e.target.checked,
                        }))
                      }
                      disabled={isSubmitting}
                      className="rounded border-zinc-300 dark:border-zinc-700 focus:ring-primary/20"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{labels[feat]}</span>
                  </label>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
