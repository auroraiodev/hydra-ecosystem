'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeaturesCardProps {
  formData: {
    foil: boolean;
    borderless: boolean;
    extendedArt: boolean;
    surgeFoil: boolean;
    prerelease: boolean;
    premierPlay: boolean;
  };
  onChange: (field: string, value: boolean) => void;
}

const FEATURE_LIST = [
  { key: 'foil', label: 'Foil' },
  { key: 'borderless', label: 'Borderless' },
  { key: 'extendedArt', label: 'Extended Art' },
  { key: 'surgeFoil', label: 'Surge Foil' },
  { key: 'prerelease', label: 'Prerelease' },
  { key: 'premierPlay', label: 'Premier Play' },
] as const;

export function FeaturesCard({ formData, onChange }: FeaturesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Características Especiales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURE_LIST.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData[key]}
                onChange={(e) => onChange(key, e.target.checked)}
                className="size-4 rounded border-zinc-300 accent-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
