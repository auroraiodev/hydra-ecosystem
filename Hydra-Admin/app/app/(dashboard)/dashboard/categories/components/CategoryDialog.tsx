'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowSync24Regular } from '@fluentui/react-icons';

type FormType = 'singles' | 'generic';

const FORM_TYPES: { value: FormType; label: string }[] = [
  { value: 'singles', label: 'Cartas individuales (Singles)' },
  { value: 'generic', label: 'Producto genérico / Sellado' },
];

const FORM_FIELDS = [
  { id: 'foil', label: 'Foil / Holográfico' },
  { id: 'condition', label: 'Condición / Estado' },
  { id: 'language', label: 'Idioma' },
  { id: 'expansion', label: 'Expansión / Edición' },
  { id: 'cardNumber', label: 'Número de carta' },
  { id: 'variant', label: 'Variante' },
  { id: 'borderless', label: 'Sin borde (Borderless)' },
  { id: 'extendedArt', label: 'Arte extendido' },
  { id: 'surgefoil', label: 'Surge Foil (Pokémon S&V)' },
  { id: 'prerelease', label: 'Prerelease' },
  { id: 'premierPlay', label: 'Premier Play' },
  { id: 'description', label: 'Descripción larga' },
  { id: 'tags', label: 'Etiquetas / Tags' },
  { id: 'images', label: 'Imágenes adicionales' },
];

interface FormConfig {
  form_type?: FormType;
  fields: Record<string, { enabled: boolean; label?: string }>;
}

interface FormState {
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  order: number;
  image_url: string;
  tcg_ids: string[];
  form_config: FormConfig;
}

interface Tcg {
  id: string;
  name: string;
  display_name: string;
}

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategoryId: string | null;
  form: FormState;
  onFormChange: (data: Partial<FormState>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  allTcgs: Tcg[];
}

export function CategoryDialog({
  isOpen,
  onClose,
  editingCategoryId,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
  allTcgs,
}: CategoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            {editingCategoryId ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {editingCategoryId
              ? 'Modifica los datos de la categoría y sus supracategorías.'
              : 'Completa los datos para crear una nueva categoría.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-1.5">
              <Label>
                Nombre visible <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Cartas Individuales"
                value={form.display_name}
                onChange={(e) => onFormChange({ display_name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Código interno <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. SINGLES"
                value={form.name}
                onChange={(e) => onFormChange({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
              />
              <p className="text-xs text-muted-foreground">
                Se convierte automáticamente a mayúsculas y sin espacios.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                placeholder="Opcional"
                value={form.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>

            <div className="pt-2 border-t">
              <Label className="text-sm font-semibold mb-2 block">
                Supracategorías / TCGs <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-4">
                Selecciona a qué TCGs pertenece esta categoría. Debe pertenecer al menos a uno
                para poder asignarle una imagen y aparecer en el marketplace.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {allTcgs.map((tcg) => (
                  <div
                    key={tcg.id}
                    className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <Switch
                      id={`tcg-${tcg.id}`}
                      checked={form.tcg_ids.includes(tcg.id)}
                      onCheckedChange={(checked) => {
                        onFormChange({
                          tcg_ids: checked
                            ? [...form.tcg_ids, tcg.id]
                            : form.tcg_ids.filter((id) => id !== tcg.id),
                        });
                      }}
                    />
                    <Label htmlFor={`tcg-${tcg.id}`} className="text-xs cursor-pointer flex-1">
                      {tcg.display_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Orden de visualización</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.order}
                onChange={(e) => onFormChange({ order: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => onFormChange({ is_active: checked })}
              />
              <Label htmlFor="is_active">Activa</Label>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Configuración del formulario de captura
              </h4>

              <div className="space-y-1.5 mb-4">
                <Label>Tipo de formulario</Label>
                <Select
                  value={form.form_config?.form_type ?? 'generic'}
                  onValueChange={(v) => onFormChange({
                    form_config: { ...form.form_config, form_type: v as FormType }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FORM_FIELDS.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <Switch
                      id={`field-${field.id}`}
                      checked={form.form_config?.fields?.[field.id]?.enabled ?? true}
                      onCheckedChange={(checked) => onFormChange({
                        form_config: {
                          ...form.form_config!,
                          fields: { ...form.form_config!.fields, [field.id]: { enabled: checked } }
                        }
                      })}
                    />
                    <Label htmlFor={`field-${field.id}`} className="text-xs cursor-pointer flex-1">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <ArrowSync24Regular className="mr-2 size-4 animate-spin" />}
            {editingCategoryId ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
