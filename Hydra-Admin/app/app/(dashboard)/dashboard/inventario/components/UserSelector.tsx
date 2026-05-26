'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkmark24Regular, ChevronUpDown24Regular } from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { type User, userName } from '../types';

interface UserSelectorProps {
  users: User[];
  isLoading: boolean;
  selectedUserId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function UserSelector({
  users,
  isLoading,
  selectedUserId,
  isOpen,
  onOpenChange,
  onSelect,
  disabled,
}: UserSelectorProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-5 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-1.5 flex-1 max-w-sm">
            <label
              htmlFor="collaborator-selector"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Colaborador
            </label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Popover open={isOpen} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    id="collaborator-selector"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls="collaborator-selector-content"
                    className="w-full justify-between font-normal h-9 px-3"
                    disabled={disabled}
                  >
                    {selectedUserId ? (
                      <span className="font-medium truncate">
                        {userName(users.find((u) => u.id === selectedUserId)!)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Seleccionar colaborador…</span>
                    )}
                    <ChevronUpDown24Regular className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent id="collaborator-selector-content" className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar colaborador…" />
                    <CommandList>
                      <CommandEmpty>No se encontró colaborador.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={userName(user)}
                            onSelect={() => {
                              onSelect(user.id);
                              onOpenChange(false);
                            }}
                          >
                            <Checkmark24Regular
                              className={cn(
                                'mr-2 size-4 text-primary',
                                selectedUserId === user.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{userName(user)}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {user.roles?.display_name || 'Sin rol'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
