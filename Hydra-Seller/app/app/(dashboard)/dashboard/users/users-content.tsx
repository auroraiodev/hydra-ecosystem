'use client';

import type React from 'react';

import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Cart24Regular,
} from '@fluentui/react-icons';
import { usersAPI, rolesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { CartManagementDialog } from '@/components/cart/cart-management-dialog';
import { UserFormDialog } from './components/UserFormDialog';

interface ApiUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  roles: {
    id: string;
    name: string;
    display_name: string;
  };
  is_active: boolean;
  created_at?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  roleId: string;
  status: 'active' | 'inactive';
}

interface Role {
  id: string;
  name: string;
  display_name: string;
}

function mapApiUserToUser(apiUser: ApiUser): User {
  const name =
    [apiUser.first_name, apiUser.last_name].filter(Boolean).join(' ') || apiUser.username || 'N/A';
  const role = apiUser.roles.name;
  const status = apiUser.is_active ? 'active' : 'inactive';

  return {
    id: apiUser.id,
    email: apiUser.email,
    name,
    username: apiUser.username,
    role,
    roleId: apiUser.roles.id,
    status,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface UsersFiltersBarProps {
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
}

function UsersFiltersBar({ searchTerm, roleFilter, statusFilter, onSearchChange, onRoleChange, onStatusChange }: UsersFiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="relative flex-1">
        <Search24Regular className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 sm:h-11"
        />
      </div>
      <select
        value={roleFilter}
        onChange={(e) => onRoleChange(e.target.value)}
        className="px-3 py-2 border border-input bg-background rounded-md text-sm h-10 sm:h-11"
      >
        <option value="">All Roles</option>
        <option value="CLIENT">Client</option>
        <option value="ADMIN">Admin</option>
        <option value="SELLER">Seller</option>
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-input bg-background rounded-md text-sm h-10 sm:h-11"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}

interface UsersMobileListProps {
  users: User[];
  isLoadingUser: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onManageCart: (user: User) => void;
}

function UsersMobileList({ users, isLoadingUser, onEdit, onDelete, onManageCart }: UsersMobileListProps) {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-sm">No users found</p>
      </div>
    );
  }
  return (
    <>
      {users.map((user) => (
        <div key={user.id} className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{user.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
            <div className="flex gap-1 ml-2 shrink-0">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => onManageCart(user)} title="Manage Cart">
                <Cart24Regular className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(user)} disabled={isLoadingUser}>
                <Edit24Regular className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => onDelete(user.id)}>
                <Delete24Regular className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Role:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' || user.role === 'SELLER' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary-foreground'}`}>
                {user.role === 'CLIENT' ? 'Client' : user.role === 'ADMIN' ? 'Admin' : user.role === 'SELLER' ? 'Seller' : user.role}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400'}`}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

interface UsersDesktopTableProps {
  users: User[];
  isLoadingUser: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onManageCart: (user: User) => void;
}

function UsersDesktopTable({ users, isLoadingUser, onEdit, onDelete, onManageCart }: UsersDesktopTableProps) {
  return (
    <table className="w-full caption-bottom text-sm">
      <thead className="border-b bg-muted/50">
        <tr>
          <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
          <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
          <th className="h-12 px-4 text-left align-middle font-medium">Username</th>
          <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
          <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={6} className="p-8 text-center text-muted-foreground">No users found</td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-4 align-middle font-medium">{user.name}</td>
              <td className="p-4 align-middle text-muted-foreground">{user.email}</td>
              <td className="p-4 align-middle text-muted-foreground">@{user.username}</td>
              <td className="p-4 align-middle">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' || user.role === 'SELLER' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary-foreground'}`}>
                  {user.role === 'CLIENT' ? 'Client' : user.role === 'ADMIN' ? 'Admin' : user.role === 'SELLER' ? 'Seller' : user.role}
                </span>
              </td>
              <td className="p-4 align-middle">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400'}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onManageCart(user)} className="size-8 p-0" title="Manage Cart">
                    <Cart24Regular className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(user)} className="size-8 p-0" disabled={isLoadingUser}>
                    <Edit24Regular className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(user.id)} className="size-8 p-0 text-destructive hover:text-destructive">
                    <Delete24Regular className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

function UsersPagination({ page, totalPages, onPrev, onNext }: UsersPaginationProps) {
  return (
    <div className="p-4 sm:p-6 pt-4 border-t border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 1} className="h-9">
            <ChevronLeft24Regular className="size-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={page === totalPages} className="h-9">
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight24Regular className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersContent() {
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    roleId: '',
  });
  const [cartUser, setCartUser] = useState<User | null>(null);
  const limit = 10;

  type FetchState = { isLoading: boolean; error: string | null };
  const [fetchState, dispatchFetch] = useReducer(
    (s: FetchState, a: Partial<FetchState>): FetchState => ({ ...s, ...a }),
    { isLoading: true, error: null }
  );
  const { isLoading, error } = fetchState;

  type FilterState = { searchTerm: string; roleFilter: string; statusFilter: string; page: number };
  const [filterState, dispatchFilter] = useReducer(
    (s: FilterState, a: Partial<FilterState>): FilterState => ({ ...s, ...a }),
    { searchTerm: '', roleFilter: '', statusFilter: '', page: 1 }
  );
  const { searchTerm, roleFilter, statusFilter, page } = filterState;

  type DialogState = { isAddOpen: boolean; editingUser: User | null; editingApiUser: ApiUser | null };
  const [dialogState, dispatchDialog] = useReducer(
    (s: DialogState, a: Partial<DialogState>): DialogState => ({ ...s, ...a }),
    { isAddOpen: false, editingUser: null, editingApiUser: null }
  );
  const { isAddOpen, editingUser, editingApiUser } = dialogState;

  type MetaState = { roles: Role[]; isLoadingRoles: boolean; isLoadingUser: boolean };
  const [metaState, dispatchMeta] = useReducer(
    (s: MetaState, a: Partial<MetaState>): MetaState => ({ ...s, ...a }),
    { roles: [], isLoadingRoles: false, isLoadingUser: false }
  );
  const { roles, isLoadingRoles, isLoadingUser } = metaState;

  // Fetch all users - GET /api/users (no parameters)
  const fetchUsers = useCallback(async () => {
    dispatchFetch({ isLoading: true, error: null });
    try {
      const response = await usersAPI.list();

      // Handle different response structures
      let usersArray: ApiUser[] = [];

      if (Array.isArray(response)) {
        usersArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        usersArray = response.data;
      } else if (response?.success && response.data && Array.isArray(response.data)) {
        usersArray = response.data;
      } else {
        console.warn('Unexpected response format:', response);
        usersArray = [];
      }

      setAllUsers(usersArray);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      let errorMessage = 'Failed to fetch users';

      if (err instanceof Error) {
        errorMessage = err.message;
        // Check if it's a network error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any).isNetworkError || err.message.includes('Network error')) {
          errorMessage =
            'Cannot connect to the backend server. Please ensure the API is running and reachable.';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((err as any).status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((err as any).status === 403) {
          errorMessage = 'Access denied. Admin or Seller role required.';
        }
      }

      dispatchFetch({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      setAllUsers([]);
      return;
    }
    dispatchFetch({ isLoading: false });
  }, [dispatchFetch]);

  const fetchRoles = useCallback(async () => {
    dispatchMeta({ isLoadingRoles: true });
    try {
      const response = await rolesAPI.list();
      let rolesArray: Role[] = [];

      if (Array.isArray(response)) {
        rolesArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rolesArray = response.data;
      } else if (response?.success && response.data && Array.isArray(response.data)) {
        rolesArray = response.data;
      } else {
        rolesArray = [];
      }

      dispatchMeta({ roles: rolesArray, isLoadingRoles: false });
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        !errorMessage.includes('Failed to fetch') &&
        !errorMessage.includes('CONNECTION_REFUSED')
      ) {
        toast.error('Failed to load roles');
      }
      dispatchMeta({ roles: [], isLoadingRoles: false });
    }
  }, [dispatchMeta]);

  useEffect(() => {
    void fetchUsers();
    void fetchRoles();
  }, [fetchUsers, fetchRoles]);

  // Filter and paginate users on the client side
  const filteredAndPaginatedUsers = useMemo(() => {
    // Map API users to User format
    const mappedUsers = allUsers.map(mapApiUserToUser);

    // Apply filters
    const filtered = mappedUsers.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && user.status === 'active') ||
        (statusFilter === 'inactive' && user.status === 'inactive');

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      users: paginated,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }, [allUsers, searchTerm, roleFilter, statusFilter, page, limit]);

  const handleSearchChange = (value: string) => {
    dispatchFilter({ searchTerm: value, page: 1 });
  };

  const handleRoleFilterChange = (value: string) => {
    dispatchFilter({ roleFilter: value, page: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    dispatchFilter({ statusFilter: value, page: 1 });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser && editingApiUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
          email: formData.email.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
        };

        if (formData.username.trim()) {
          updatePayload.username = formData.username.trim();
        }

        if (formData.roleId?.trim()) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(formData.roleId.trim())) {
            updatePayload.role_id = formData.roleId.trim();
          } else {
            toast.error('Invalid role ID format');
            return;
          }
        }

        await usersAPI.update(editingUser.id, updatePayload);
        toast.success('User updated successfully');
        await fetchUsers();
        handleCloseDialog();
      } else {
        // Create user
        if (!formData.roleId?.trim()) {
          toast.error('Please select a role');
          return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(formData.roleId.trim())) {
          toast.error('Invalid role ID format');
          return;
        }

        const createPayload = {
          email: formData.email.trim(),
          username: formData.username.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          role_id: formData.roleId.trim(),
        };

        await usersAPI.create(createPayload);
        toast.success('User created successfully');
        await fetchUsers();
        handleCloseDialog();
      }
    } catch (err) {
      console.error('Error saving user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await usersAPI.delete(id);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const handleEditUser = async (user: User) => {
    try {
      dispatchMeta({ isLoadingUser: true });
      // Fetch user by ID using GET /api/users/{id}
      const response = await usersAPI.get(user.id);

      // Handle different response structures
      let apiUser: ApiUser | null = null;

      if (response && typeof response === 'object') {
        // If response is the user object directly
        if ('id' in response && 'email' in response) {
          apiUser = response as ApiUser;
        }
        // If response has a data property
        else if ('data' in response && response.data && typeof response.data === 'object') {
          apiUser = response.data as ApiUser;
        }
        // If response has success and data
        else if (
          'success' in response &&
          'data' in response &&
          response.data &&
          typeof response.data === 'object'
        ) {
          apiUser = response.data as ApiUser;
        }
      }

      if (!apiUser) {
        toast.error('Failed to load user data');
        dispatchMeta({ isLoadingUser: false });
        return;
      }

      dispatchDialog({ editingUser: user, editingApiUser: apiUser, isAddOpen: true });
      setFormData({
        email: apiUser.email,
        username: apiUser.username,
        first_name: apiUser.first_name || '',
        last_name: apiUser.last_name || '',
        roleId: apiUser.roles.id,
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      toast.error(errorMessage);
    } finally {
      dispatchMeta({ isLoadingUser: false });
    }
  };

  const handleCloseDialog = () => {
    dispatchDialog({ isAddOpen: false, editingUser: null, editingApiUser: null });
    setFormData({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      roleId: '',
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title="Users"
        description="Manage admin and user accounts"
        action={
          <Button onClick={() => { handleCloseDialog(); dispatchDialog({ isAddOpen: true }); }} className="w-full sm:w-auto" size="sm">
            <Add24Regular className="mr-2 size-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <UserFormDialog
        open={isAddOpen}
        onOpenChange={(open) => dispatchDialog({ isAddOpen: open })}
        editingUser={editingUser}
        formData={formData}
        onFormDataChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
        onSubmit={handleAddUser}
        onClose={handleCloseDialog}
      />

      {/* Filters */}
      <UsersFiltersBar
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleFilterChange}
        onStatusChange={handleStatusFilterChange}
      />

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">All Users</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Showing {filteredAndPaginatedUsers.users.length} of {filteredAndPaginatedUsers.total}{' '}
            users
            {isLoading && ' (loading...)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {error && (
            <div className="m-4 sm:m-6 p-3 sm:p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              Error: {error}
            </div>
          )}
          {isLoading ? (
            <>
              {/* Mobile Skeleton */}
              <div className="block sm:hidden divide-y divide-border">
                {Array.from({ length: 3 }, (_, n) => n).map((n) => (
                  <div key={`skel-mobile-${n}`} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Skeleton */}
              <div className="hidden sm:block">
                <div className="p-6">
                  <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, n) => n).map((n) => (
                      <div
                        key={`skel-desktop-${n}`}
                        className="flex items-center gap-4 p-4 border rounded"
                      >
                        <Skeleton className="size-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="size-8 rounded" />
                        <Skeleton className="size-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-border">
                <UsersMobileList
                  users={filteredAndPaginatedUsers.users}
                  isLoadingUser={isLoadingUser}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onManageCart={setCartUser}
                />
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block relative w-full overflow-auto">
                <UsersDesktopTable
                  users={filteredAndPaginatedUsers.users}
                  isLoadingUser={isLoadingUser}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onManageCart={setCartUser}
                />
              </div>

              {/* Pagination */}
              {filteredAndPaginatedUsers.totalPages > 1 && (
                <UsersPagination
                  page={page}
                  totalPages={filteredAndPaginatedUsers.totalPages}
                  onPrev={() => dispatchFilter({ page: Math.max(1, page - 1) })}
                  onNext={() => dispatchFilter({ page: Math.min(filteredAndPaginatedUsers.totalPages, page + 1) })}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cart Management Dialog */}
      {cartUser && (
        <CartManagementDialog
          open={!!cartUser}
          onOpenChange={(_, data) => {
            if (!data.open) setCartUser(null);
          }}
          userId={cartUser.id}
          userName={cartUser.name}
          userEmail={cartUser.email}
        />
      )}
    </PageLayout>
  );
}
