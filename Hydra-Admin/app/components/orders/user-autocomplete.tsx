'use client';

import * as React from 'react';
import {
  Checkmark24Regular,
  ChevronUpDown24Regular,
  Person24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
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
import { usersAPI } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface UserAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  pendingOrdersOnly?: boolean;
}

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface AutocompleteState {
  open: boolean;
  search: string;
  users: UserData[];
  selectedUser: UserData | null;
  isPending: boolean;
}

type AutocompleteAction =
  | { type: 'SET_OPEN'; open: boolean }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_USERS'; users: UserData[] }
  | { type: 'SET_SELECTED_USER'; user: UserData | null }
  | { type: 'SET_PENDING'; pending: boolean };

function autocompleteReducer(state: AutocompleteState, action: AutocompleteAction): AutocompleteState {
  switch (action.type) {
    case 'SET_OPEN':
      return { ...state, open: action.open };
    case 'SET_SEARCH':
      return { ...state, search: action.search };
    case 'SET_USERS':
      return { ...state, users: action.users };
    case 'SET_SELECTED_USER':
      return { ...state, selectedUser: action.user };
    case 'SET_PENDING':
      return { ...state, isPending: action.pending };
    default:
      return state;
  }
}

export function UserAutocomplete({
  value,
  onValueChange,
  placeholder = 'Filtrar por usuario...',
  pendingOrdersOnly = false,
}: UserAutocompleteProps) {
  const [state, dispatch] = React.useReducer(autocompleteReducer, {
    open: false,
    search: '',
    users: [],
    selectedUser: null,
    isPending: false,
  });

  const { open, search, users, selectedUser, isPending } = state;
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    if (debouncedSearch.length < 2) {
      dispatch({ type: 'SET_USERS', users: [] });
      return;
    }

    const fetchUsers = async () => {
      dispatch({ type: 'SET_PENDING', pending: true });
      try {
        const response = await usersAPI.list(debouncedSearch, false, pendingOrdersOnly);
        let userData: UserData[] = [];
        if (response && response.data) {
          userData = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          userData = response;
        }
        dispatch({ type: 'SET_USERS', users: userData });
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        dispatch({ type: 'SET_PENDING', pending: false });
      }
    };

    fetchUsers();
  }, [debouncedSearch, pendingOrdersOnly]);

  React.useEffect(() => {
    if (value && value !== selectedUser?.id) {
      const fetchSelectedUser = async () => {
        try {
          const user = await usersAPI.get(value);
          if (user) {
            dispatch({ type: 'SET_SELECTED_USER', user });
          }
        } catch (error) {
          console.error('Failed to fetch selected user:', error);
        }
      };
      fetchSelectedUser();
    } else if (!value && selectedUser) {
      dispatch({ type: 'SET_SELECTED_USER', user: null });
    }
  }, [value, selectedUser?.id, selectedUser]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={(val) => dispatch({ type: 'SET_OPEN', open: val })}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls="users-listbox"
            className="w-full sm:w-[250px] justify-between font-normal h-9"
          >
            <div className="flex items-center gap-2 truncate">
              <Person24Regular className="size-4 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedUser
                  ? [selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') ||
                    selectedUser.email ||
                    selectedUser.username ||
                    'Usuario sin nombre'
                  : placeholder}
              </span>
            </div>
            <ChevronUpDown24Regular className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nombre o email..."
              value={search}
              onValueChange={(val) => dispatch({ type: 'SET_SEARCH', search: val })}
            />
            <CommandList id="users-listbox">
              <CommandEmpty>
                {isPending ? 'Buscando usuarios...' : 'No se encontraron usuarios.'}
              </CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onValueChange(user.id);
                      dispatch({ type: 'SET_SELECTED_USER', user });
                      dispatch({ type: 'SET_OPEN', open: false });
                    }}
                  >
                    <Checkmark24Regular
                      className={cn('mr-2 size-4', value === user.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onValueChange('')}
        >
          <Dismiss24Regular className="size-4" />
        </Button>
      )}
    </div>
  );
}
