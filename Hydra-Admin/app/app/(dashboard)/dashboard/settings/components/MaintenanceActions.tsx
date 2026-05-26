'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings24Regular,
  ArrowCounterclockwise24Regular,
  ArrowDownload24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';

interface MaintenanceActionsProps {
  onClearCache: () => void;
  clearingCache: boolean;
  onExportDb: () => void;
  exportingDb: boolean;
  onFactoryReset: () => void;
  resettingFactory: boolean;
}

export function MaintenanceActions({
  onClearCache,
  clearingCache,
  onExportDb,
  exportingDb,
  onFactoryReset,
  resettingFactory,
}: MaintenanceActionsProps) {
  return (
    <Card className="glass-card border-none bg-red-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Settings24Regular className="size-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-red-600">Mantenimiento</CardTitle>
            <CardDescription>Acciones críticas del sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={onClearCache}
          disabled={clearingCache}
        >
          <ArrowCounterclockwise24Regular className={`size-5 ${clearingCache ? 'animate-spin' : ''}`} />
          <div className="text-center">
            <p className="text-sm font-semibold">Limpiar Caché</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
              Refrescar Marketplace
            </p>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={onExportDb}
          disabled={exportingDb}
        >
          <ArrowDownload24Regular className="size-5" />
          <div className="text-center">
            <p className="text-sm font-semibold">Respaldar DB</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
              Exportar SQL/JSON
            </p>
          </div>
        </Button>
        <Button
          variant="destructive"
          className="h-auto p-4 flex flex-col items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20"
          onClick={onFactoryReset}
          disabled={resettingFactory}
        >
          <Warning24Regular className="size-5" />
          <div className="text-center">
            <p className="text-sm font-semibold">Factory Reset</p>
            <p className="text-[10px] text-red-600/60 uppercase font-bold tracking-wider mt-1">
              Borrar todo
            </p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
