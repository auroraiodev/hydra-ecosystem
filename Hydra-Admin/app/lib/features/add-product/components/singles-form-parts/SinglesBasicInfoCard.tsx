import React from 'react';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Condition, type Language, type ProductFormData } from '../../types';

interface SinglesBasicInfoCardProps {
  formData: ProductFormData;
  onUpdateForm: (field: keyof ProductFormData, value: string | number | boolean | string[]) => void;
  conditions: Condition[];
  languages: Language[];
  validationErrors: Record<string, string>;
  isLoadingConditions: boolean;
  isLoadingLanguages: boolean;
}

export function SinglesBasicInfoCard({
  formData,
  onUpdateForm,
  conditions,
  languages,
  validationErrors,
  isLoadingConditions,
  isLoadingLanguages,
}: SinglesBasicInfoCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <FormItem>
          <FormLabel>Expansion / Set</FormLabel>
          <FormControl>
            <Input
              value={formData.expansion || ''}
              onChange={(e) => onUpdateForm('expansion', e.target.value)}
              placeholder="e.g. Modern Horizons 3"
            />
          </FormControl>
          {validationErrors.expansion && (
            <p className="text-[10px] text-destructive">{validationErrors.expansion}</p>
          )}
        </FormItem>

        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Card #</FormLabel>
            <FormControl>
              <Input
                value={formData.cardNumber || ''}
                onChange={(e) => onUpdateForm('cardNumber', e.target.value)}
                placeholder="e.g. 123"
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Stock</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                value={formData.stock || 1}
                onChange={(e) => onUpdateForm('stock', parseInt(e.target.value) || 1)}
              />
            </FormControl>
          </FormItem>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Condition</FormLabel>
            <Select
              value={formData.condition_id || ''}
              onValueChange={(val) => onUpdateForm('condition_id', val)}
              disabled={isLoadingConditions}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingConditions ? 'Loading...' : 'Select'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {conditions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <FormItem>
            <FormLabel>Language</FormLabel>
            <Select
              value={formData.language_id || ''}
              onValueChange={(val) => onUpdateForm('language_id', val)}
              disabled={isLoadingLanguages}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingLanguages ? 'Loading...' : 'Select'} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.displayName || l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        </div>
      </div>

      <div className="space-y-4">
        <FormItem>
          <FormLabel>Final Price (MXN)</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              value={formData.finalPrice || ''}
              onChange={(e) => onUpdateForm('finalPrice', parseFloat(e.target.value) || 0)}
              className="text-lg font-bold"
            />
          </FormControl>
          {validationErrors.finalPrice && (
            <p className="text-[10px] text-destructive">{validationErrors.finalPrice}</p>
          )}
        </FormItem>

        <div className="grid grid-cols-2 gap-4 opacity-60">
          <FormItem>
            <FormLabel>Import Price</FormLabel>
            <Input value={formData.priceMxnImportation || 0} readOnly disabled />
          </FormItem>
          <FormItem>
            <FormLabel>Local Price</FormLabel>
            <Input value={formData.priceMxnLocal || 0} readOnly disabled />
          </FormItem>
        </div>

        <FormItem>
          <FormLabel>Variant / Extra Info</FormLabel>
          <FormControl>
            <Input
              value={formData.variant || ''}
              onChange={(e) => onUpdateForm('variant', e.target.value)}
              placeholder="e.g. Retro Frame"
            />
          </FormControl>
        </FormItem>
      </div>
    </div>
  );
}
