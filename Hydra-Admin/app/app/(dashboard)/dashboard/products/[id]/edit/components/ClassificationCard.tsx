'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface MetadataItem {
  id: string;
  name: string;
  display_name?: string;
}

interface ClassificationCardProps {
  condition_id: string;
  language_id: string;
  category_id: string;
  conditions: MetadataItem[];
  languages: MetadataItem[];
  categories: MetadataItem[];
  onChange: (field: string, value: string) => void;
}

export function ClassificationCard({
  condition_id,
  language_id,
  category_id,
  conditions,
  languages,
  categories,
  onChange,
}: ClassificationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clasificación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="condition">Condición</Label>
            <select
              id="condition"
              value={condition_id}
              onChange={(e) => onChange('condition_id', e.target.value)}
              className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">Sin cambios</option>
              {conditions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name || c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="language">Idioma</Label>
            <select
              id="language"
              value={language_id}
              onChange={(e) => onChange('language_id', e.target.value)}
              className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">Sin cambios</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.display_name || l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              value={category_id}
              onChange={(e) => onChange('category_id', e.target.value)}
              className="w-full mt-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">Sin cambios</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name || c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
