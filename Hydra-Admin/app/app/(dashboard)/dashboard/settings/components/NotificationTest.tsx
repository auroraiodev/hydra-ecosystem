'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings24Regular,
  Search24Regular,
  SpinnerIos20Regular,
  Send24Regular,
} from '@fluentui/react-icons';

interface User {
  id: string;
  email: string;
}

interface NotificationTestProps {
  testNotif: { userId: string; title: string; message: string };
  onUpdate: (update: Partial<NotificationTestProps['testNotif']>) => void;
  onSend: () => void;
  sending: boolean;
  users: User[];
  loadingUsers: boolean;
  userSearchOpen: boolean;
  onUserSearchOpenChange: (open: boolean) => void;
  userSearchQuery: string;
  onUserSearchQueryChange: (query: string) => void;
}

export function NotificationTest({
  testNotif,
  onUpdate,
  onSend,
  sending,
  users,
  loadingUsers,
  userSearchOpen,
  onUserSearchOpenChange,
  userSearchQuery,
  onUserSearchQueryChange,
}: NotificationTestProps) {
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Settings24Regular className="size-5 text-yellow-600" />
          </div>
          <div>
            <CardTitle>Prueba de Notificaciones</CardTitle>
            <CardDescription>Enviar una notificación de prueba a un usuario</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Usuario Destino</Label>
            <Dialog open={userSearchOpen} onOpenChange={onUserSearchOpenChange}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 bg-card/50 border-none ring-1 ring-primary/5"
                >
                  {testNotif.userId
                    ? users.find((u) => u.id === testNotif.userId)?.email || 'Usuario seleccionado'
                    : 'Seleccionar usuario…'}
                  <Search24Regular className="size-4 opacity-40" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass-card border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle>Buscar Usuario</DialogTitle>
                  <DialogDescription>
                    Busca por nombre o email para enviar la prueba
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="relative">
                    <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                    <Input
                      placeholder="Buscar…"
                      className="pl-10"
                      value={userSearchQuery}
                      onChange={(e) => onUserSearchQueryChange(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    {loadingUsers ? (
                      <div className="flex justify-center p-8">
                        <SpinnerIos20Regular className="size-6 animate-spin opacity-30" />
                      </div>
                    ) : users.length === 0 ? (
                      <p className="text-center py-8 text-xs font-bold text-muted-foreground/40 uppercase">
                        No se encontraron usuarios
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {users.map((u) => (
                          <Button
                            key={u.id}
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 rounded-lg"
                            onClick={() => {
                              onUpdate({ userId: u.id });
                              onUserSearchOpenChange(false);
                            }}
                          >
                            <div className="text-left">
                              <p className="text-sm font-semibold">{u.email}</p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              * Dejar vacío para enviar a todos los administradores
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notifTitle">Título</Label>
            <Input
              id="notifTitle"
              value={testNotif.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notifMessage">Mensaje</Label>
          <Textarea
            id="notifMessage"
            rows={3}
            value={testNotif.message}
            onChange={(e) => onUpdate({ message: e.target.value })}
          />
        </div>
        <Button
          className="w-full"
          onClick={onSend}
          disabled={sending || !testNotif.title || !testNotif.message}
        >
          {sending ? (
            <SpinnerIos20Regular className="size-4 animate-spin mr-2" />
          ) : (
            <Send24Regular className="size-4 mr-2" />
          )}
          Enviar Notificación
        </Button>
      </CardContent>
    </Card>
  );
}
