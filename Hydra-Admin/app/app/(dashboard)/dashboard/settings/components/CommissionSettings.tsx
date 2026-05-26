'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyHand24Regular } from '@fluentui/react-icons';

interface CommissionSettingsProps {
  settings: {
    platformFee: string | number;
    mpFeeRate: string | number;
  };
  onUpdate: (update: Partial<CommissionSettingsProps['settings']>) => void;
}

export function CommissionSettings({ settings, onUpdate }: CommissionSettingsProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <MoneyHand24Regular className="size-5 text-green-600" />
          </div>
          <div>
            <CardTitle>Comisiones de Venta</CardTitle>
            <CardDescription>
              Porcentajes que retiene la plataforma en cada venta de vendedor
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="platformFee">Comisión Plataforma (%)</Label>
            <Input
              id="platformFee"
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={settings.platformFee}
              onChange={(e) => onUpdate({ platformFee: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Ej: 0.12 = 12%. El vendedor recibe {Math.round((1 - Number(settings.platformFee)) * 100)}%.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mpFeeRate">Cargo Mercado Pago (%)</Label>
            <Input
              id="mpFeeRate"
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={settings.mpFeeRate}
              onChange={(e) => onUpdate({ mpFeeRate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Ej: 0.035 = 3.5%. Se descuenta además de la comisión plataforma en pagos con Mercado Pago.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
