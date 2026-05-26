'use client';

import type React from 'react';
import { useEffect, useCallback, useReducer, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Add24Regular, Warning24Regular } from '@fluentui/react-icons';
import { usersAPI, rolesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { CartManagementDialog } from '@/components/cart/cart-management-dialog';

import { UserKpis } from './components/UserKpis';
import { UserFilters } from './components/UserFilters';
import { UserTable } from './components/UserTable';
import { UserFormDialog } from './components/UserFormDialog';
import { type User, type ApiUser, type Role, mapApiUserToUser, initialFormData } from './types';

// ─── Reducers ─────────────────────────────────────────────────────────────────

interface FilterState {
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  page: number;
  sortField: keyof User | '';
  sortDir: 'asc' | 'desc';
}

type FilterAction =
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_ROLE_FILTER'; role: string }
  | { type: 'SET_STATUS_FILTER'; status: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_SORT'; field: keyof User };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH': return { ...state, searchTerm: action.search, page: 1 };
    case 'SET_ROLE_FILTER': return { ...state, roleFilter: action.role, page: 1 };
    case 'SET_STATUS_FILTER': return { ...state, statusFilter: action.status, page: 1 };
    case 'SET_PAGE': return { ...state, page: action.page };
    case 'SET_SORT': {
      const sameField = state.sortField === action.field;
      return {
        ...state,
        sortField: action.field,
        sortDir: sameField && state.sortDir === 'asc' ? 'desc' : 'asc',
        page: 1,
      };
    }
    default: return state;
  }
}

interface DialogState {
  isOpen: boolean;
  editingUser: User | null;
  editingApiUser: ApiUser | null;
  formData: typeof initialFormData;
}

type DialogAction =
  | { type: 'OPEN_ADD' }
  | { type: 'OPEN_EDIT'; user: User; apiUser: ApiUser }
  | { type: 'CLOSE' }
  | { type: 'SET_FORM'; form: Partial<typeof initialFormData> };

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'OPEN_ADD': return { isOpen: true, editingUser: null, editingApiUser: null, formData: initialFormData };
    case 'OPEN_EDIT': return {
      isOpen: true, editingUser: action.user, editingApiUser: action.apiUser,
      formData: {
        email: action.apiUser.email, username: action.apiUser.username,
        first_name: action.apiUser.first_name || '', last_name: action.apiUser.last_name || '',
        roleId: action.apiUser.roles.id, is_hydra_alias: action.apiUser.is_hydra_alias || false,
      },
    };
    case 'CLOSE': return { ...state, isOpen: false };
    case 'SET_FORM': return { ...state, formData: { ...state.formData, ...action.form } };
    default: return state;
  }
}

interface UsersState {
  allUsers: ApiUser[];
  isLoading: boolean;
  error: string | null;
  roles: Role[];
  isLoadingRoles: boolean;
  isLoadingUser: boolean;
  cartUser: User | null;
}

type UsersAction =
  | { type: 'SET_USERS'; users: ApiUser[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_ROLES'; roles: Role[] }
  | { type: 'SET_LOADING_ROLES'; loading: boolean }
  | { type: 'SET_LOADING_USER'; loading: boolean }
  | { type: 'SET_CART_USER'; user: User | null };

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case 'SET_USERS': return { ...state, allUsers: action.users };
    case 'SET_LOADING': return { ...state, isLoading: action.loading };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'SET_ROLES': return { ...state, roles: action.roles };
    case 'SET_LOADING_ROLES': return { ...state, isLoadingRoles: action.loading };
    case 'SET_LOADING_USER': return { ...state, isLoadingUser: action.loading };
    case 'SET_CART_USER': return { ...state, cartUser: action.user };
    default: return state;
  }
}

const initialUsersState: UsersState = {
  allUsers: [], isLoading: true, error: null, roles: [],
  isLoadingRoles: false, isLoadingUser: false, cartUser: null,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersContent() {
  const [state, dispatch] = useReducer(usersReducer, initialUsersState);
  const { allUsers, isLoading, error, roles, isLoadingRoles, cartUser } = state;

  const [filter, dispatchFilter] = useReducer(filterReducer, {
    searchTerm: '', roleFilter: '', statusFilter: '', page: 1,
    sortField: '' as keyof User | '', sortDir: 'asc' as const,
  });
  const limit = 10;

  const [dialog, dispatchDialog] = useReducer(dialogReducer, {
    isOpen: false, editingUser: null, editingApiUser: null, formData: initialFormData,
  });

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const response = await usersAPI.list();
      const usersArray: ApiUser[] = Array.isArray(response) ? response : (response?.data || []);
      dispatch({ type: 'SET_USERS', users: usersArray });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch users';
      dispatch({ type: 'SET_ERROR', error: msg });
      toast.error(msg);
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_ROLES', loading: true });
    try {
      const response = await rolesAPI.list();
      dispatch({ type: 'SET_ROLES', roles: Array.isArray(response) ? response : (response?.data || []) });
    } catch (err) {
      console.error(err);
      dispatch({ type: 'SET_ROLES', roles: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_ROLES', loading: false });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const filteredAndPaginatedUsers = useMemo(() => {
    const filtered = allUsers.reduce<User[]>((acc, apiUser) => {
      const user = mapApiUserToUser(apiUser);
      const matchesSearch = user.email.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
                          user.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(filter.searchTerm.toLowerCase());
      const matchesRole = !filter.roleFilter || user.role === filter.roleFilter;
      const matchesStatus = !filter.statusFilter || user.status === filter.statusFilter;

      if (matchesSearch && matchesRole && matchesStatus) {
        acc.push(user);
      }
      return acc;
    }, []);

    if (filter.sortField) {
      const field = filter.sortField;
      const dir = filter.sortDir === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        const av = (a[field] ?? '') as string;
        const bv = (b[field] ?? '') as string;
        return av.localeCompare(bv) * dir;
      });
    }

    const startIndex = (filter.page - 1) * limit;
    return {
      users: filtered.slice(startIndex, startIndex + limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }, [allUsers, filter, limit]);

  const handleAddOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { email, first_name, last_name, is_hydra_alias, username, roleId } = dialog.formData;
      if (dialog.editingUser) {
        await usersAPI.update(dialog.editingUser.id, {
          email: email.trim(), first_name: first_name.trim(), last_name: last_name.trim(),
          is_hydra_alias, username: username.trim(), role_id: roleId.trim()
        });
        toast.success('User updated successfully');
      } else {
        await usersAPI.create({
          email: email.trim(), username: username.trim(), first_name: first_name.trim(),
          last_name: last_name.trim(), role_id: roleId.trim()
        });
        toast.success('User created successfully');
      }
      fetchUsers();
      dispatchDialog({ type: 'CLOSE' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      await usersAPI.update(userId, { role_id: newRoleId });
      toast.success('User role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleEditUser = async (user: User) => {
    try {
      dispatch({ type: 'SET_LOADING_USER', loading: true });
      const response = await usersAPI.get(user.id);
      const apiUser = response?.data || response;
      if (apiUser) dispatchDialog({ type: 'OPEN_EDIT', user, apiUser });
    } catch {
      toast.error('Failed to load user data');
    } finally {
      dispatch({ type: 'SET_LOADING_USER', loading: false });
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Users"
        description="Manage admin and user accounts"
        action={
          <Button onClick={() => dispatchDialog({ type: 'OPEN_ADD' })} size="sm">
            <Add24Regular className="mr-2 size-4" />
            Add User
          </Button>
        }
      />

      <UserFilters
        searchTerm={filter.searchTerm}
        onSearchChange={(s) => dispatchFilter({ type: 'SET_SEARCH', search: s })}
        roleFilter={filter.roleFilter}
        onRoleFilterChange={(r) => dispatchFilter({ type: 'SET_ROLE_FILTER', role: r })}
        statusFilter={filter.statusFilter}
        onStatusFilterChange={(s) => dispatchFilter({ type: 'SET_STATUS_FILTER', status: s })}
      />

      <UserKpis users={allUsers} />

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">All Users</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Showing {filteredAndPaginatedUsers.users.length} of {filteredAndPaginatedUsers.total} users
            {isLoading && ' (loading…)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {error && (
            <div className="m-4 p-8 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <Warning24Regular className="size-6 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                Try again
              </Button>
            </div>
          )}
          <UserTable
            users={filteredAndPaginatedUsers.users}
            currentPage={filter.page}
            totalPages={filteredAndPaginatedUsers.totalPages}
            onPageChange={(p) => dispatchFilter({ type: 'SET_PAGE', page: p })}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onManageCart={(u) => dispatch({ type: 'SET_CART_USER', user: u })}
            roles={roles}
            onRoleChange={handleRoleChange}
            isLoading={isLoading}
            sortField={filter.sortField}
            sortDir={filter.sortDir}
            onSort={(field) => dispatchFilter({ type: 'SET_SORT', field })}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        isOpen={dialog.isOpen}
        onClose={() => dispatchDialog({ type: 'CLOSE' })}
        editingUser={dialog.editingUser}
        formData={dialog.formData}
        onFormChange={(f) => dispatchDialog({ type: 'SET_FORM', form: f })}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
        onSubmit={handleAddOrUpdateUser}
      />

      {cartUser && (
        <CartManagementDialog
          open={!!cartUser}
          onOpenChange={(open) => !open && dispatch({ type: 'SET_CART_USER', user: null })}
          userId={cartUser.id}
          userName={cartUser.name}
          userEmail={cartUser.email}
        />
      )}
    </PageLayout>
  );
}
