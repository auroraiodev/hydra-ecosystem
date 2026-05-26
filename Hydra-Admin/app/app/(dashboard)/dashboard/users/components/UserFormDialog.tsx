'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { User, Role, initialFormData } from '../types';

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  formData: typeof initialFormData;
  onFormChange: (form: Partial<typeof initialFormData>) => void;
  roles: Role[];
  isLoadingRoles: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function UserFormDialog({
  isOpen,
  onClose,
  editingUser,
  formData,
  onFormChange,
  roles,
  isLoadingRoles,
  onSubmit,
}: UserFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {editingUser ? 'Update user details' : 'Create a new user account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-sm">
                First Name
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => onFormChange({ first_name: e.target.value })}
                placeholder="John"
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-sm">
                Last Name
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => onFormChange({ last_name: e.target.value })}
                placeholder="Doe"
                required
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange({ email: e.target.value })}
              placeholder="user@example.com"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="username" className="text-sm">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => onFormChange({ username: e.target.value })}
              placeholder="johndoe"
              required={!editingUser}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="role" className="text-sm">
              Role
            </Label>
            {isLoadingRoles ? (
              <div className="mt-1.5 w-full">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <select
                id="role"
                value={formData.roleId}
                onChange={(e) => onFormChange({ roleId: e.target.value })}
                className="mt-1.5 w-full px-3 py-2 border border-input bg-background rounded-md text-sm h-10"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name} ({role.name})
                  </option>
                ))}
              </select>
            )}
          </div>
          {formData.roleId &&
            roles.find((r) => r.id === formData.roleId)?.name === 'SELLER' && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                <div className="space-y-0.5">
                  <Label htmlFor="is_hydra_alias" className="text-sm">
                    Alias de Hydra
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Ocultar nombre de tienda y mostrar como "Hydra"
                  </p>
                </div>
                <Switch
                  id="is_hydra_alias"
                  checked={formData.is_hydra_alias}
                  onCheckedChange={(checked) => onFormChange({ is_hydra_alias: checked })}
                />
              </div>
            )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
