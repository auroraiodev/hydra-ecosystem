'use client';

import { useEffect, useState, useReducer } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Person24Regular,
  Mail24Regular,
  ArrowExit24Regular,
  StoreMicrosoft24Regular,
  DocumentText24Regular,
  Save24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { usersAPI } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface UserData {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string | null;
  avatarUrl?: string;
  picture?: string;
  store_name?: string;
  rfc?: string;
  store_logo_url?: string;
}

type ProfileState = {
  user: UserData | null;
  loading: boolean;
  storeData: { store_name: string; rfc: string; store_logo_url: string };
};

export default function ProfileContent() {
  const { user: authUser, logout } = useAuth();
  const [profileState, dispatchProfile] = useReducer(
    (s: ProfileState, a: Partial<ProfileState>): ProfileState => ({ ...s, ...a }),
    { user: null, loading: true, storeData: { store_name: '', rfc: '', store_logo_url: '' } }
  );
  const { user, loading, storeData } = profileState;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authUser) {
      const firstName = authUser.first_name || '';
      const lastName = authUser.last_name || '';
      const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        authUser.email ||
        'User';

      const authUserTyped = authUser as {
        avatar_url?: string | null;
        store_name?: string;
        rfc?: string;
        store_logo_url?: string;
      };

      dispatchProfile({
        user: {
          ...authUser,
          first_name: firstName,
          last_name: lastName,
          name: fullName,
          avatarUrl: authUser.avatar_url || '',
          store_name: authUserTyped.store_name || '',
          rfc: authUserTyped.rfc || '',
          store_logo_url: authUserTyped.store_logo_url || '',
        },
        storeData: {
          store_name: authUserTyped.store_name || '',
          rfc: authUserTyped.rfc || '',
          store_logo_url: authUserTyped.store_logo_url || '',
        },
        loading: false,
      });
    }
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSaveStore = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersAPI.update(user.id, storeData);
      const updatedUser = { ...user, ...storeData };
      dispatchProfile({ user: updatedUser as UserData });
      toast.success('Información de la tienda actualizada');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la tienda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="size-20 sm:h-24 sm:w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">No se pudo cargar la información del usuario</p>
        <Button onClick={handleLogout} variant="outline">
          <ArrowExit24Regular className="mr-2 size-4" />
          Cerrar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Perfil"
        description="Gestiona tu información de perfil y configuración de cuenta"
      />

      <Card>
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
          <CardDescription>Tu información personal y de cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6">
            <Avatar className="size-20 sm:h-24 sm:w-24">
              <AvatarImage
                src={user.avatarUrl || user.picture}
                alt={user.name || user.email || 'User'}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl">
                {user.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : user.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <Person24Regular className="size-12" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-semibold">{user.name || 'Usuario'}</h3>
              {user.username && <p className="text-muted-foreground">@{user.username}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Mail24Regular className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{user.email}</p>
              </div>
            </div>

            {user.first_name && (
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Person24Regular className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-base">
                    {[user.first_name, user.last_name].filter(Boolean).join(' ') ||
                      'No especificado'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleLogout} variant="destructive">
              <ArrowExit24Regular className="mr-2 size-4" />
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Tienda</CardTitle>
          <CardDescription>Configura la identidad de tu tienda en el marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store_name">Nombre de la Tienda</Label>
              <div className="relative">
                <StoreMicrosoft24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="store_name"
                  placeholder="Ej. Mi Tienda TCG"
                  className="pl-10"
                  value={storeData.store_name}
                  onChange={(e) =>
                    dispatchProfile({ storeData: { ...storeData, store_name: e.target.value } })
                  }
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Este nombre aparecerá en tus artículos como &quot;Vendido por [Nombre]&quot;
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc">RFC (Opcional)</Label>
              <div className="relative">
                <DocumentText24Regular className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="rfc"
                  placeholder="RFC de la empresa"
                  className="pl-10"
                  value={storeData.rfc}
                  onChange={(e) => dispatchProfile({ storeData: { ...storeData, rfc: e.target.value } })}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="store_logo_url">URL del Logo de la Tienda</Label>
              <div className="relative">
                <Input
                  id="store_logo_url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={storeData.store_logo_url}
                  onChange={(e) =>
                    dispatchProfile({ storeData: { ...storeData, store_logo_url: e.target.value } })
                  }
                />
              </div>
              {storeData.store_logo_url && (
                <div className="mt-2 flex items-center gap-3 p-3 border rounded-lg bg-primary/5">
                  <div className="relative size-12 rounded-lg overflow-hidden border bg-white">
                    <Image
                      src={storeData.store_logo_url}
                      alt="Vista previa logo"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Vista previa del logo</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleSaveStore} disabled={saving} className="min-w-[150px]">
              {saving ? (
                'Guardando...'
              ) : (
                <>
                  <Save24Regular className="mr-2 size-4" />
                  Guardar Tienda
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
