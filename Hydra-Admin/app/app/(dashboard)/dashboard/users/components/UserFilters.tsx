'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search24Regular } from '@fluentui/react-icons';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function UserFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="relative flex-1">
        <Search24Regular className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 sm:h-11"
        />
      </div>
      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        className="w-full sm:w-auto sm:min-w-[160px] px-3 py-2 border border-input bg-background rounded-md text-sm h-10 sm:h-11 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
      >
        <option value="">All Roles</option>
        <option value="CLIENT">Client</option>
        <option value="ADMIN">Admin</option>
        <option value="SELLER">Seller</option>
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-full sm:w-auto sm:min-w-[160px] px-3 py-2 border border-input bg-background rounded-md text-sm h-10 sm:h-11 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
