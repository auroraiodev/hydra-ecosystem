'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warning24Regular, ArrowSync24Regular } from '@fluentui/react-icons';
import type { Tcg } from '../types';

interface TcgDeleteDialogProps {
  tcg: Tcg | null;
  onClose: () => void;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function TcgDeleteDialog({
  tcg,
  onClose,
  confirmText,
  onConfirmTextChange,
  isDeleting,
  onConfirm,
}: TcgDeleteDialogProps) {
  return (
    <Dialog open={!!tcg} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Warning24Regular className="size-5" />
            Eliminar Supracategoría
          </DialogTitle>
          <DialogDescription>
            Esta acción eliminará permanentemente la supracategoría y todo su contenido
            relacionado.
          </DialogDescription>
        </DialogHeader>

        {tcg && (
          <div className="space-y-4 py-1">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-destructive">
                Esta acción es permanente e irreversible.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  <span className="font-semibold text-foreground">
                    {tcg._count?.categories ?? 0}
                  </span>{' '}
                  categor{(tcg._count?.categories ?? 0) !== 1 ? 'ías' : 'ía'} serán
                  eliminadas
                </li>
                <li>
                  <span className="font-semibold text-foreground">
                    {tcg._count?.singles ?? 0}
                  </span>{' '}
                  producto{(tcg._count?.singles ?? 0) !== 1 ? 's' : ''} serán eliminados
                  permanentemente
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Para confirmar, escribe el código{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold">
                  {tcg.name}
                </code>
              </Label>
              <Input
                placeholder={tcg.name}
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting || confirmText !== tcg?.name}
          >
            {isDeleting && <ArrowSync24Regular className="mr-2 size-4 animate-spin" />}
            Eliminar todo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
