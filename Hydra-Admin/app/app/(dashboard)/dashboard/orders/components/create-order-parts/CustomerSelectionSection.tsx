import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search24Regular } from '@fluentui/react-icons';

interface UserListItem {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface CustomerSelectionSectionProps {
  searchUser: string;
  onSearchUserChange: (val: string) => void;
  filteredUsers: UserListItem[];
  selectedUserId: string;
  onSelectUser: (userId: string, label: string) => void;
}

export function CustomerSelectionSection({
  searchUser,
  onSearchUserChange,
  filteredUsers,
  selectedUserId,
  onSelectUser,
}: CustomerSelectionSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Customer</Label>
      <div className="relative">
        <Search24Regular className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search user…"
          value={searchUser}
          onChange={(e) => onSearchUserChange(e.target.value)}
          className="pl-8"
        />
      </div>
      {searchUser && (
        <div className="border rounded-md max-h-40 overflow-y-auto mt-2">
          {filteredUsers.length === 0 ? (
            <div className="p-2 text-sm text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                className={`p-2 hover:bg-muted cursor-pointer flex justify-between items-center ${selectedUserId === user.id ? 'bg-primary/10' : ''}`}
                onClick={() =>
                  onSelectUser(
                    user.id,
                    `${user.first_name || ''} ${user.last_name || ''} (${user.email})`
                  )
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  onSelectUser(
                    user.id,
                    `${user.first_name || ''} ${user.last_name || ''} (${user.email})`
                  )
                }
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </div>
                {selectedUserId === user.id && (
                  <div className="text-primary text-xs font-bold">Selected</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
