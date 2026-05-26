'use client';

import { useEffect, useReducer } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Person24Regular, Mail24Regular, SignOut24Regular } from '@fluentui/react-icons';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';

interface UserData {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  avatarUrl?: string;
  picture?: string;
}

interface ProfileState {
  user: UserData | null | undefined;
}

type ProfileAction = { type: 'SET_USER'; user: UserData | null | undefined };

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };
    default:
      return state;
  }
}

export default function ProfileContent() {
  const { user: authUser, logout } = useAuth();
  const [state, dispatch] = useReducer(profileReducer, { user: undefined });
  const { user } = state;

  useEffect(() => {
    if (authUser) {
      const firstName = authUser.first_name || '';
      const lastName = authUser.last_name || '';
      const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        authUser.email ||
        'User';

      const { avatar_url: _avatar_url, ...rest } = authUser;

      dispatch({
        type: 'SET_USER',
        user: {
          ...rest,
          first_name: firstName,
          last_name: lastName,
          name: fullName,
          avatarUrl: authUser.avatar_url || '',
        },
      });
    }
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
  };

  if (user === undefined) {
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
          <SignOut24Regular className="mr-2 size-4" />
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
              <SignOut24Regular className="mr-2 size-4" />
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
