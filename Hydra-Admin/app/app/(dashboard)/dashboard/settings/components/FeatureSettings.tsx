'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkmark24Regular } from '@fluentui/react-icons';

interface FeatureSettingsProps {
  settings: {
    enableNotifications: boolean;
    enableTwoFactor: boolean;
  };
  onUpdate: (update: Partial<FeatureSettingsProps['settings']>) => void;
}

export function FeatureSettings({ settings, onUpdate }: FeatureSettingsProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <Checkmark24Regular className="size-5 text-teal-600" />
          </div>
          <div>
            <CardTitle>Funcionalidades</CardTitle>
            <CardDescription>Habilitar o deshabilitar módulos del sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base">Notificaciones</Label>
            <p className="text-sm text-muted-foreground">
              Habilitar el envío de correos y push notifications
            </p>
          </div>
          <Switch
            checked={settings.enableNotifications}
            onCheckedChange={(checked) => onUpdate({ enableNotifications: checked })}
          />
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base">Autenticación en dos pasos (2FA)</Label>
            <p className="text-sm text-muted-foreground">
              Requerir verificación adicional para administradores
            </p>
          </div>
          <Switch
            checked={settings.enableTwoFactor}
            onCheckedChange={(checked) => onUpdate({ enableTwoFactor: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
