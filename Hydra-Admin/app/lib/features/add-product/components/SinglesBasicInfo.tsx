'use client';

import React from 'react';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Condition, Language, ProductFormData } from '../types';
import { SinglesBasicInfoCard } from './singles-form-parts/SinglesBasicInfoCard';
import { SinglesTagsCard } from './singles-form-parts/SinglesTagsCard';
import { SinglesAttributesCard } from './singles-form-parts/SinglesAttributesCard';

interface SinglesBasicInfoProps {
  formData: Partial<ProductFormData>;
  setFormData: (update: Partial<ProductFormData> | ((prev: Partial<ProductFormData>) => Partial<ProductFormData>)) => void;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  conditions: Condition[];
  isLoadingConditions: boolean;
  languages: Language[];
  isLoadingLanguages: boolean;
  availableTags: Array<{ id: string; name: string; display_name?: string }>;
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
  availableTags,
  defaultTags,
  newTagInput,
  setNewTagInput,
  formConfig,
}: SinglesBasicInfoProps) {
  const isFieldEnabled = (fieldId: string) => {
    if (!formConfig) return true;
    return formConfig.fields?.[fieldId]?.enabled ?? true;
  };

  const onUpdateForm = (field: keyof ProductFormData, value: string | number | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Primary Card Name Field */}
      <FormItem>
        <FormLabel htmlFor="cardName" className="text-base font-medium">
          Nombre de la Carta *
        </FormLabel>
        <FormControl>
          <Input
            id="cardName"
            value={formData.cardName || ''}
            onChange={(e) => onUpdateForm('cardName', e.target.value)}
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

      {/* Main Info Grid (Price, Stock, Conditions, etc.) */}
      <SinglesBasicInfoCard
        formData={formData as ProductFormData}
        onUpdateForm={onUpdateForm}
        conditions={conditions}
        languages={languages}
        validationErrors={validationErrors}
        isLoadingConditions={isLoadingConditions}
        isLoadingLanguages={isLoadingLanguages}
      />

      {/* Tags Section */}
      {isFieldEnabled('tags') && (
        <SinglesTagsCard
          tags={formData.tags || []}
          availableTags={availableTags}
          defaultTags={defaultTags}
          onUpdateTags={(tags: string[]) => onUpdateForm('tags', tags)}
          newTagInput={newTagInput}
          onNewTagInputChange={setNewTagInput}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Special Attributes (Foil, Borderless, etc.) */}
      <SinglesAttributesCard
        formData={formData as ProductFormData}
        onUpdateForm={onUpdateForm}
      />
    </div>
  );
}
