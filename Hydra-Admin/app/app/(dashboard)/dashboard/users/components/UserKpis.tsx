'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiUser } from '../types';

interface UserKpisProps {
  users: ApiUser[];
}

export function UserKpis({ users }: UserKpisProps) {
  const clients = users.filter((u) => u.roles.name === 'CLIENT').length;
  const sellers = users.filter((u) => u.roles.name === 'SELLER').length;
  const admins = users.filter((u) => u.roles.name === 'ADMIN').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients}</div>
          <p className="text-xs text-muted-foreground mt-1">Regular marketplace users</p>
        </CardContent>
      </Card>
      <Card className="bg-orange-500/5 border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Sellers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{sellers}</div>
          <p className="text-xs text-muted-foreground mt-1">Users with inventory access</p>
        </CardContent>
      </Card>
      <Card className="bg-teal-500/5 border-teal-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-teal-600 dark:text-teal-400">
            Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{admins}</div>
          <p className="text-xs text-muted-foreground mt-1">Full dashboard access</p>
        </CardContent>
      </Card>
    </div>
  );
}
