'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Edit24Regular, Delete24Regular, Tag24Regular,
  ChevronUp24Regular, ChevronDown24Regular, ChevronUpDown24Regular,
} from '@fluentui/react-icons';

interface Tag {
  id: string;
  name: string;
  display_name?: string;
  is_default: boolean;
  is_active: boolean;
}

type SortField = 'name' | 'display_name' | 'is_default' | 'is_active';

function SortIcon({ col, sortField, sortDir }: { col: SortField; sortField: SortField; sortDir: 'asc' | 'desc' }) {
  if (sortField !== col) return <ChevronUpDown24Regular className="size-3.5 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp24Regular className="size-3.5 ml-1" />
    : <ChevronDown24Regular className="size-3.5 ml-1" />;
}

interface TagsTableProps {
  tags: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}

export function TagsTable({ tags, onEdit, onDelete }: TagsTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...tags].sort((a, b) => {
      switch (sortField) {
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'display_name': return (a.display_name || a.name).localeCompare(b.display_name || b.name) * dir;
        case 'is_default': return (Number(b.is_default) - Number(a.is_default)) * dir;
        case 'is_active': return (Number(b.is_active) - Number(a.is_active)) * dir;
        default: return 0;
      }
    });
  }, [tags, sortField, sortDir]);

  const thSort = 'text-left p-3 font-medium cursor-pointer hover:bg-muted select-none';

  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className={thSort} onClick={() => handleSort('name')}>
              <span className="flex items-center">Name<SortIcon col="name" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => handleSort('display_name')}>
              <span className="flex items-center">Display Name<SortIcon col="display_name" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => handleSort('is_default')}>
              <span className="flex items-center">Default<SortIcon col="is_default" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className={thSort} onClick={() => handleSort('is_active')}>
              <span className="flex items-center">Status<SortIcon col="is_active" sortField={sortField} sortDir={sortDir} /></span>
            </th>
            <th className="text-right p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tag) => (
            <tr key={tag.id} className="border-b hover:bg-muted/50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Tag24Regular className="size-4 text-muted-foreground" />
                  {tag.name}
                </div>
              </td>
              <td className="p-3">{tag.display_name || tag.name}</td>
              <td className="p-3">
                {tag.is_default ? (
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                    Default
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3">
                {tag.is_active ? (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                    Active
                  </span>
                ) : (
                  <span className="text-xs bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(tag)}>
                    <Edit24Regular className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(tag.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Delete24Regular className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
