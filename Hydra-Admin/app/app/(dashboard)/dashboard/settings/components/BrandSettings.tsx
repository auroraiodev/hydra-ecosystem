'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings24Regular } from '@fluentui/react-icons';

interface BrandSettingsProps {
  settings: {
    siteLogo: string;
    siteLoader: string;
  };
  onUpdate: (update: Partial<BrandSettingsProps['settings']>) => void;
}

export function BrandSettings({ settings, onUpdate }: BrandSettingsProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Settings24Regular className="size-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>Imágenes y Marca</CardTitle>
            <CardDescription>URLs de logo, favicon y loader personalizado</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="siteLogo">URL del Logo</Label>
            <Input
              id="siteLogo"
              value={settings.siteLogo}
              onChange={(e) => onUpdate({ siteLogo: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteLoader">URL del Loader</Label>
            <Input
              id="siteLoader"
              value={settings.siteLoader}
              onChange={(e) => onUpdate({ siteLoader: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
