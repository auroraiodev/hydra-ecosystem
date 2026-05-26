'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings24Regular } from '@fluentui/react-icons';

interface TaxSettingsProps {
  settings: {
    importationTax: string | number;
    importationProfit: string | number;
    importationFixedFee: string | number;
  };
  onUpdate: (update: Partial<TaxSettingsProps['settings']>) => void;
}

export function TaxSettings({ settings, onUpdate }: TaxSettingsProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Settings24Regular className="size-5 text-orange-600" />
          </div>
          <div>
            <CardTitle>Impuestos Globales</CardTitle>
            <CardDescription>
              Configuración de impuestos y márgenes para importación
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="importationTax">Tax Importación (%)</Label>
            <Input
              id="importationTax"
              type="number"
              step="0.01"
              value={settings.importationTax}
              onChange={(e) => onUpdate({ importationTax: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="importationProfit">Profit Importación (%)</Label>
            <Input
              id="importationProfit"
              type="number"
              step="0.01"
              value={settings.importationProfit}
              onChange={(e) => onUpdate({ importationProfit: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="importationFixedFee">Costo Fijo Adicional ($)</Label>
            <Input
              id="importationFixedFee"
              type="number"
              step="0.01"
              value={settings.importationFixedFee}
              onChange={(e) => onUpdate({ importationFixedFee: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
