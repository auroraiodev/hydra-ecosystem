'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search24Regular, ChevronUpDown24Regular, Checkmark24Regular } from '@fluentui/react-icons';
import { cn } from '@/lib/utils';

interface ProductsFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTcg: string;
  onTcgChange: (tcg: string) => void;
  tcgs: { id: string; name: string; display_name?: string }[];
  ownerFilter: string;
  onOwnerChange: (id: string) => void;
  ownerOpen: boolean;
  onOwnerOpenChange: (open: boolean) => void;
  users: { id: string; email: string; firstName?: string; lastName?: string }[];
  hideOutOfStock: boolean;
  onHideOutOfStockChange: (hide: boolean) => void;
}

export function ProductsFilter({
  searchTerm,
  onSearchChange,
  selectedTcg,
  onTcgChange,
  tcgs,
  ownerFilter,
  onOwnerChange,
  ownerOpen,
  onOwnerOpenChange,
  users,
  hideOutOfStock,
  onHideOutOfStockChange,
}: ProductsFilterProps) {
  const selectedUser = users.find((u) => u.id === ownerFilter);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 glass-card bg-primary/[0.02] items-center">
      <div className="relative flex-1 w-full">
        <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, código o expansión..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-10 bg-background border border-border rounded-lg hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <Select value={selectedTcg} onValueChange={onTcgChange}>
          <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background border border-border rounded-lg hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary text-sm">
            <SelectValue placeholder="Sistema (TCG)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los TCGs</SelectItem>
            {tcgs.map((tcg) => (
              <SelectItem key={tcg.id} value={tcg.id}>
                {tcg.display_name || tcg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={ownerOpen} onOpenChange={onOwnerOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={ownerOpen}
              aria-controls="owner-filter-content"
              className="h-10 min-h-0 w-full sm:w-[220px] justify-between font-normal bg-background border border-border rounded-lg hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary text-sm px-3"
            >
              <span className="truncate">
                {ownerFilter === 'all' || !ownerFilter
                  ? 'Todos los dueños'
                  : selectedUser
                    ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
                      selectedUser.email
                    : 'Dueño'}
              </span>
              <ChevronUpDown24Regular className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent id="owner-filter-content" className="w-[220px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar dueño..." />
              <CommandList>
                <CommandEmpty>No se encontró dueño.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      onOwnerChange('all');
                      onOwnerOpenChange(false);
                    }}
                  >
                    <Checkmark24Regular
                      className={cn(
                        'mr-2 size-4 text-primary',
                        ownerFilter === 'all' || !ownerFilter ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    Todos los dueños
                  </CommandItem>
                  {users.map((user) => {
                    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                    return (
                      <CommandItem
                        key={user.id}
                        value={name}
                        onSelect={() => {
                          onOwnerChange(user.id);
                          onOwnerOpenChange(false);
                        }}
                      >
                        <Checkmark24Regular
                          className={cn(
                            'mr-2 size-4 text-primary',
                            ownerFilter === user.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant={hideOutOfStock ? 'default' : 'outline'}
          onClick={() => onHideOutOfStockChange(!hideOutOfStock)}
          className={cn(
            'h-10 min-h-0 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all w-full sm:w-auto border',
            hideOutOfStock
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:border-primary/50 text-text-muted'
          )}
        >
          {hideOutOfStock ? 'Mostrando en Stock' : 'Ver Agotados'}
        </Button>
      </div>
    </div>
  );
}
