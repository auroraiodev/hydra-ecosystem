'use client';

import React, { useState } from 'react';
import {
  Person24Regular,
  Checkmark24Regular,
  ChevronUpDown24Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { OwnerSelectorProps } from './types';

export function OwnerSelector({ selectedOwner, owners, onSelect, loading }: OwnerSelectorProps) {
  const [open, setOpen] = useState(false);

  if (loading && !selectedOwner)
    return <div className="h-6 w-32 bg-zinc-100 animate-pulse rounded" />;

  // If only one owner (seller mode), keep it as a simple badge
  if (owners.length <= 1) {
    return (
      <div className="flex items-center gap-2 p-1">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
          <Person24Regular className="size-3.5 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
            {selectedOwner?.name || 'Mi Colección'}
          </span>
          <span className="size-1.5 bg-green-500 rounded-full"></span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50">
          Propietario
        </span>
      </div>
    );
  }

  // Admin mode: Searchable selector
  return (
    <div className="flex items-center gap-2 p-1">
      <Popover open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <PopoverTrigger>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls="owner-selector-listbox"
            className="h-8 justify-between bg-zinc-100 border-zinc-200 hover:bg-zinc-200 rounded-full px-3 py-0 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <Person24Regular className="size-3.5 text-zinc-500" />
              <span className="truncate max-w-[150px]">
                {selectedOwner ? selectedOwner.name : 'Seleccionar Propietario'}
              </span>
              <span className="size-1.5 bg-green-500 rounded-full"></span>
            </div>
            <ChevronUpDown24Regular className="ml-2 size-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0 shadow-xl border-zinc-200">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search24Regular className="mr-2 size-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Buscar vendedor..."
                className="h-9 border-none focus:ring-0"
              />
            </div>
            <CommandList id="owner-selector-listbox">
              <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
              <CommandGroup heading="Vendedores Disponibles">
                {owners.map((owner) => (
                  <CommandItem
                    key={owner.id}
                    value={owner.name || owner.email}
                    onSelect={() => {
                      onSelect(owner);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{owner.name}</span>
                      <span className="text-[10px] text-muted-foreground">{owner.email}</span>
                    </div>
                    <Checkmark24Regular
                      className={cn(
                        'size-4 text-primary',
                        selectedOwner?.id === owner.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50">
        Propietario
      </span>
    </div>
  );
}
