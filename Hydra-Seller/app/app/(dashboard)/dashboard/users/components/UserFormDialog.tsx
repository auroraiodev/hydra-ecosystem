'use client';

import type React from 'react';
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

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface UserFormData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  roleId: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: { id: string } | null;
  formData: UserFormData;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  roles: Role[];
  isLoadingRoles: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  formData,
  onFormDataChange,
  roles,
  isLoadingRoles,
  onSubmit,
  onClose,
}: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
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
                onChange={(e) => onFormDataChange({ first_name: e.target.value })}
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
                onChange={(e) => onFormDataChange({ last_name: e.target.value })}
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
              onChange={(e) => onFormDataChange({ email: e.target.value })}
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
              onChange={(e) => onFormDataChange({ username: e.target.value })}
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
                onChange={(e) => onFormDataChange({ roleId: e.target.value })}
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
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
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
