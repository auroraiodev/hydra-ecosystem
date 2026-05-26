'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImg } from '@/components/ui/safe-img';
import {
  ArrowDownload24Regular,
  ArrowCounterclockwise24Regular,
  Warning24Regular,
  SpinnerIos20Regular,
  Save24Regular,
  CheckmarkCircle24Regular,
  FastForward24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { type ApiProduct, type CountEntry, productName, productDetail } from '../types';

interface InventoryReportProps {
  products: ApiProduct[];
  counts: CountEntry[];
  ownerName: string;
  onApplyFixes: (fixes: { id: string; stock: number }[]) => void;
  onReset: () => void;
  applying: boolean;
}

function exportCSV(products: ApiProduct[], counts: CountEntry[], ownerName: string) {
  const headers = [
    'Carta',
    'Expansión',
    'Condición',
    'Idioma',
    'Sistema',
    'Físico',
    'Diferencia',
    'Estado',
  ];
  const rows = counts.map((c) => {
    const p = products.find((x) => x.id === c.productId)!;
    const diff = c.physicalStock - c.systemStock;
    const status = c.skipped ? 'Saltado' : diff === 0 ? 'OK' : diff > 0 ? 'Excedente' : 'Faltante';
    return [
      productName(p),
      p.expansion || p.variant || '',
      p.conditions?.display_name || p.conditions?.name || '',
      p.languages?.display_name || p.languages?.name || '',
      c.systemStock,
      c.skipped ? '' : c.physicalStock,
      c.skipped ? '' : diff,
      status,
    ];
  });

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventario_${ownerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function InventoryReport({
  products,
  counts,
  ownerName,
  onApplyFixes,
  onReset,
  applying,
}: InventoryReportProps) {
  const counted = counts.filter((c) => !c.skipped);
  const skipped = counts.filter((c) => c.skipped);
  const discrepancies = counted.filter((c) => c.physicalStock !== c.systemStock);
  const matches = counted.filter((c) => c.physicalStock === c.systemStock);

  const fixes = discrepancies.map((c) => ({ id: c.productId, stock: c.physicalStock }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {ownerName} · {new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(products, counts, ownerName)}
          >
            <ArrowDownload24Regular className="size-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <ArrowCounterclockwise24Regular className="size-4 mr-2" />
            Nuevo conteo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Contadas
            </p>
            <p className="text-2xl font-bold">{counted.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Sin diferencia
            </p>
            <p className="text-2xl font-bold text-green-600">{matches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Discrepancias
            </p>
            <p className="text-2xl font-bold text-destructive">{discrepancies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Saltadas
            </p>
            <p className="text-2xl font-bold text-muted-foreground">{skipped.length}</p>
          </CardContent>
        </Card>
      </div>

      {discrepancies.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Warning24Regular className="size-4 text-destructive" />
                {discrepancies.length} discrepancia{discrepancies.length !== 1 ? 's' : ''}
              </CardTitle>
              {fixes.length > 0 && (
                <Button size="sm" onClick={() => onApplyFixes(fixes)} disabled={applying}>
                  {applying ? (
                    <SpinnerIos20Regular className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save24Regular className="size-4 mr-2" />
                  )}
                  Aplicar {fixes.length} corrección{fixes.length !== 1 ? 'es' : ''}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2 text-left">Carta</th>
                    <th className="px-4 py-2 text-center">Sistema</th>
                    <th className="px-4 py-2 text-center">Físico</th>
                    <th className="px-4 py-2 text-center">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {discrepancies.map((c) => {
                    const p = products.find((x) => x.id === c.productId)!;
                    const diff = c.physicalStock - c.systemStock;
                    return (
                      <tr key={c.productId} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <SafeImg
                              src={p.img}
                              alt={productName(p)}
                              className="h-10 w-7 object-contain rounded shrink-0"
                            />
                            <div>
                              <p className="font-medium">{productName(p)}</p>
                              <p className="text-xs text-muted-foreground">{productDetail(p)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{c.systemStock}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {c.physicalStock}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={diff > 0 ? 'outline' : 'destructive'}
                            className={cn(diff > 0 && 'border-blue-400 text-blue-600')}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckmarkCircle24Regular className="size-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold text-lg">¡Inventario perfecto!</p>
            <p className="text-muted-foreground text-sm">
              Todas las cartas contadas coinciden con el sistema.
            </p>
          </CardContent>
        </Card>
      )}

      {skipped.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
              <FastForward24Regular className="size-4" />
              {skipped.length} carta{skipped.length !== 1 ? 's' : ''} saltada
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {skipped.map((c) => {
                const p = products.find((x) => x.id === c.productId)!;
                return (
                  <div key={c.productId} className="px-4 py-2.5 flex items-center gap-3">
                    <SafeImg
                      src={p.img}
                      alt={productName(p)}
                      className="h-8 w-6 object-contain rounded shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{productName(p)}</p>
                      <p className="text-xs text-muted-foreground">{productDetail(p)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Sistema: {c.systemStock}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
