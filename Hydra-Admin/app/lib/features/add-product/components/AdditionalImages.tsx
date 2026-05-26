'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';

interface AdditionalImagesProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

export function AdditionalImages({ imageUrls, onChange }: AdditionalImagesProps) {
  // Use stable IDs for keys to avoid focus issues and satisfy lint
  const [items, setItems] = React.useState<{ id: string; url: string }[]>(() =>
    imageUrls.map((url, i) => ({ id: `img-${i}-${Date.now()}`, url }))
  );

  // Sync internal state with props if they change externally (rare but possible)
  const prevPropsUrlsRef = React.useRef(imageUrls);
  React.useEffect(() => {
    if (imageUrls !== prevPropsUrlsRef.current) {
      setItems(imageUrls.map((url, i) => ({ id: `img-${i}-${Date.now()}`, url })));
      prevPropsUrlsRef.current = imageUrls;
    }
  }, [imageUrls]);

  const handleUrlChange = (id: string, value: string) => {
    const nextItems = items.map(item => item.id === id ? { ...item, url: value } : item);
    setItems(nextItems);
    onChange(nextItems.map(item => item.url));
  };

  const handleRemove = (id: string) => {
    const nextItems = items.filter(item => item.id !== id);
    setItems(nextItems);
    onChange(nextItems.map(item => item.url));
  };

  const handleAdd = () => {
    const newItem = { id: `img-new-${Date.now()}-${Math.random()}`, url: '' };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    onChange(nextItems.map(item => item.url));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">
        Imágenes Adicionales
      </Label>
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-2 items-start group">
              <div className="flex-1">
                <Input
                  value={item.url}
                  onChange={(e) => handleUrlChange(item.id, e.target.value)}
                  placeholder={`URL de imagen adicional ${index + 1}`}
                  className="bg-primary/[0.02] border-primary/5 focus:border-primary/20 transition-all"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(item.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors opacity-40 group-hover:opacity-100"
              >
                <span className="sr-only">Eliminar</span>
                <Delete24Regular className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="mt-2 text-[10px] font-bold uppercase tracking-widest border-primary/10 hover:bg-primary/5 h-9 px-4"
      >
        <Add24Regular className="size-4 mr-2" />
        Agregar Imagen
      </Button>
    </div>
  );
}
