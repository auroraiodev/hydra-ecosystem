import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search24Regular, People24Regular } from '@fluentui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';

interface UserOption {
  id: string;
  name: string;
  email: string;
  username: string;
}

interface UserSelectionCardProps {
  userSearch: string;
  onSearchChange: (search: string) => void;
  isLoadingUsers: boolean;
  filteredUsers: UserOption[];
  selectedUserId?: string;
  onSelectUser: (user: UserOption) => void;
}

export function UserSelectionCard({
  userSearch,
  onSearchChange,
  isLoadingUsers,
  filteredUsers,
  selectedUserId,
  onSelectUser,
}: UserSelectionCardProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <People24Regular className="size-4" />
          Select User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={userSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto divide-y border rounded-md">
          {isLoadingUsers ? (
            <div className="p-4 space-y-3">
              {['sk-u1', 'sk-u2', 'sk-u3', 'sk-u4', 'sk-u5'].map((id) => (
                <div key={id} className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                  selectedUserId === user.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
