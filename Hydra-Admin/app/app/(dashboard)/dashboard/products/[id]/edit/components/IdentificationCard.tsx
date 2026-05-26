'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IdentificationCardProps {
  cardName: string;
  expansion: string;
  cardNumber: string;
  variant: string;
  onChange: (field: string, value: string) => void;
}

export function IdentificationCard({
  cardName,
  expansion,
  cardNumber,
  variant,
  onChange,
}: IdentificationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Identificación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cardName">Nombre de la Carta *</Label>
          <Input
            id="cardName"
            value={cardName}
            onChange={(e) => onChange('cardName', e.target.value)}
            placeholder="Ej. Ral, Storm Conduit"
            required
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expansion">Expansión</Label>
            <Input
              id="expansion"
              value={expansion}
              onChange={(e) => onChange('expansion', e.target.value)}
              placeholder="Ej. LTR, M21"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cardNumber">Número de Carta</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => onChange('cardNumber', e.target.value)}
              placeholder="Ej. 451"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="variant">Variante</Label>
          <Input
            id="variant"
            value={variant}
            onChange={(e) => onChange('variant', e.target.value)}
            placeholder="Ej. The List, Showcase, etc."
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
