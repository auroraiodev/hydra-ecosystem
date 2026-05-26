import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { type ProductFormData } from '../../types';

interface SinglesAttributesCardProps {
  formData: ProductFormData;
  onUpdateForm: (field: keyof ProductFormData, value: string | number | boolean | string[]) => void;
}

export function SinglesAttributesCard({ formData, onUpdateForm }: SinglesAttributesCardProps) {
  const checkboxes = [
    { id: 'foil', label: 'Foil' },
    { id: 'borderless', label: 'Borderless' },
    { id: 'extendedArt', label: 'Extended Art' },
    { id: 'prerelease', label: 'Prerelease' },
    { id: 'isAlternateFrame', label: 'Alt Frame' },
    { id: 'isShowcase', label: 'Showcase' },
    { id: 'isSerialized', label: 'Serialized' },
    { id: 'surgeFoil', label: 'Surge Foil' },
  ];

  return (
    <Card className="border-none shadow-none bg-muted/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {checkboxes.map((cb) => (
            <FormItem key={cb.id} className="flex flex-row items-start gap-x-3 gap-y-0">
              <FormControl>
                <Checkbox
                  checked={!!formData[cb.id]}
                  onCheckedChange={(checked) => onUpdateForm(cb.id, !!checked)}
                />
              </FormControl>
              <FormLabel className="text-xs font-medium cursor-pointer">
                {cb.label}
              </FormLabel>
            </FormItem>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
