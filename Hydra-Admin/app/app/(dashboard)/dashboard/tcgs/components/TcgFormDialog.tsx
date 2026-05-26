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
import { Switch } from '@/components/ui/switch';
import { ArrowSync24Regular } from '@fluentui/react-icons';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Tcg } from '../types';

interface TcgFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTcg: Tcg | null;
  form: {
    name: string;
    display_name: string;
    logo_url: string;
    icon_url: string;
    loader_url: string;
    is_active: boolean;
    order: number;
  };
  onFormChange: (form: Partial<TcgFormDialogProps['form']>) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function TcgFormDialog({
  isOpen,
  onClose,
  editingTcg,
  form,
  onFormChange,
  isSubmitting,
  onSubmit,
}: TcgFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col gap-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            {editingTcg ? 'Editar Supracategoría' : 'Nueva Supracategoría'}
          </DialogTitle>
          <DialogDescription>
            {editingTcg
              ? 'Modifica los detalles de la supracategoría.'
              : 'Crea una nueva supracategoría para organizar el catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
          <div className="space-y-6 pb-6 pt-2">
            <div className="space-y-1.5">
              <Label>
                Nombre visible <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Magic: The Gathering"
                value={form.display_name}
                onChange={(e) => onFormChange({ display_name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Código interno <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. MTG"
                value={form.name}
                onChange={(e) =>
                  onFormChange({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })
                }
              />
              <p className="text-xs text-muted-foreground">
                Mayúsculas sin espacios. Se usa internamente para filtros.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Logo completo (Banner)</Label>
              <ImageUpload
                value={form.logo_url || ''}
                onChange={(url) => onFormChange({ logo_url: url })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Icono / Login Icon (Logo pequeño)</Label>
              <ImageUpload
                value={form.icon_url || ''}
                onChange={(url) => onFormChange({ icon_url: url })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Imagen del Loader (Custom Animation)</Label>
              <ImageUpload
                value={form.loader_url || ''}
                onChange={(url) => onFormChange({ loader_url: url })}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="tcg_active"
                checked={form.is_active}
                onCheckedChange={(checked) => onFormChange({ is_active: checked })}
              />
              <Label htmlFor="tcg_active">Activo</Label>
            </div>

            <div className="space-y-1.5">
              <Label>Orden de aparición</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.order}
                onChange={(e) => onFormChange({ order: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Menor número aparece primero (ej. 0, 1, 2).
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <ArrowSync24Regular className="mr-2 size-4 animate-spin" />}
            {editingTcg ? 'Guardar cambios' : 'Crear Supracategoría'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
