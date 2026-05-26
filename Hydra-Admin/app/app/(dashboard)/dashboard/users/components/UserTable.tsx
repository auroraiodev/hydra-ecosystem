'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit24Regular,
  Delete24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Cart24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  ChevronUpDown24Regular,
} from '@fluentui/react-icons';
import type { User, Role } from '../types';

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SortIcon({ col, sortField, sortDir }: { col: keyof User | string; sortField: keyof User | ''; sortDir: 'asc' | 'desc' }) {
  if (sortField !== col) return <ChevronUpDown24Regular className="size-3.5 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3.5 ml-1" />
    : <ChevronDown24Regular className="size-3.5 ml-1" />;
}

interface UserTableProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onManageCart: (user: User) => void;
  roles: Role[];
  onRoleChange: (userId: string, roleId: string) => void;
  isLoading: boolean;
  sortField: keyof User | '';
  sortDir: 'asc' | 'desc';
  onSort: (field: keyof User) => void;
}

export function UserTable({
  users,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onManageCart,
  roles,
  onRoleChange,
  isLoading,
  sortField,
  sortDir,
  onSort,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {['sk-d1', 'sk-d2', 'sk-d3', 'sk-d4', 'sk-d5'].map((id) => (
            <div key={id} className="flex items-center gap-4 p-4 border rounded">
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
    );
  }

  const thSort = 'text-left p-4 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-muted select-none';
  const thStatic = 'text-left p-4 font-semibold text-xs uppercase tracking-wider';

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-border">
        {users.map((user) => (
          <div key={user.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                {user.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                {user.is_hydra_alias && (
                  <Badge variant="secondary" className="text-[10px] bg-teal-50 text-teal-700">Hydra Alias</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Joined {formatJoinDate(user.joined_at)}
              </p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => onManageCart(user)}>
                  <Cart24Regular className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(user)}>
                  <Edit24Regular className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => onDelete(user.id)}>
                  <Delete24Regular className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className={thSort} onClick={() => onSort('name')}>
                <span className="flex items-center">User<SortIcon col="name" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className={thStatic}>Role</th>
              <th className={thSort} onClick={() => onSort('status')}>
                <span className="flex items-center">Status<SortIcon col="status" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className={thSort} onClick={() => onSort('joined_at')}>
                <span className="flex items-center">Joined<SortIcon col="joined_at" sortField={sortField} sortDir={sortDir} /></span>
              </th>
              <th className="text-right p-4 font-semibold text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1.5">
                    <select
                      value={user.roleId}
                      onChange={(e) => onRoleChange(user.id, e.target.value)}
                      className="text-xs border bg-background rounded px-2 py-1 focus:ring-1 ring-primary outline-none"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.display_name}</option>
                      ))}
                    </select>
                    {user.is_hydra_alias && (
                      <Badge variant="outline" className="w-fit text-[9px] py-0 bg-teal-50 text-teal-700 border-teal-200">
                        HYDRA ALIAS
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="text-xs text-muted-foreground">
                    {formatJoinDate(user.joined_at)}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="size-8" title="Manage Cart" onClick={() => onManageCart(user)}>
                      <Cart24Regular className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(user)}>
                      <Edit24Regular className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => onDelete(user.id)}>
                      <Delete24Regular className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
              <ChevronLeft24Regular className="mr-1 size-4" />Prev
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
              Next<ChevronRight24Regular className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
