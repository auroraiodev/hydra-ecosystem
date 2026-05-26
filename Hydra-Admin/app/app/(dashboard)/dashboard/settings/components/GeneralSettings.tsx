'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Color24Regular } from '@fluentui/react-icons';

interface GeneralSettingsProps {
  settings: {
    siteName: string;
    adminEmail: string;
    supportEmail: string;
    maxProductsPerPage: string | number;
    shippingCost: string | number;
  };
  onUpdate: (update: Partial<GeneralSettingsProps['settings']>) => void;
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Color24Regular className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>General</CardTitle>
            <CardDescription>Nombre del sitio y contactos principales.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nombre del sitio</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => onUpdate({ siteName: e.target.value })}
              placeholder="Hydra Marketplace…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email del Administrador</Label>
            <Input
              id="adminEmail"
              value={settings.adminEmail}
              onChange={(e) => onUpdate({ adminEmail: e.target.value })}
              placeholder="admin@hydracollect.com…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email de Soporte</Label>
            <Input
              id="supportEmail"
              value={settings.supportEmail}
              onChange={(e) => onUpdate({ supportEmail: e.target.value })}
              placeholder="soporte@hydracollect.com…"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maxProductsPerPage">Productos por Página</Label>
            <Input
              id="maxProductsPerPage"
              type="number"
              value={settings.maxProductsPerPage}
              onChange={(e) => onUpdate({ maxProductsPerPage: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingCost">Costo de Envío Base ($)</Label>
            <Input
              id="shippingCost"
              type="number"
              value={settings.shippingCost}
              onChange={(e) => onUpdate({ shippingCost: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
