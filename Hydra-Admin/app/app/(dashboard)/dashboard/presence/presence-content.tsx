'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { presenceAPI } from '@/lib/api';
import { Circle20Filled, ArrowClockwise24Regular } from '@fluentui/react-icons';

interface OnlineUser {
  user_id: string;
  last_seen: string;
  current_page: string | null;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    avatar_url: string | null;
    roles: { name: string };
  };
}

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  return `hace ${Math.floor(seconds / 60)}m`;
}

function roleBadgeVariant(role: string) {
  if (role === 'ADMIN') return 'destructive';
  if (role === 'SELLER') return 'secondary';
  return 'outline';
}

export default function PresenceContent() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchOnline = useCallback(async () => {
    try {
      const data = await presenceAPI.getOnline();
      setUsers(Array.isArray(data) ? data : (data?.data ?? []));
      setLastRefresh(new Date());
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline();
    const interval = setInterval(fetchOnline, 15_000);
    return () => clearInterval(interval);
  }, [fetchOnline]);

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Usuarios Conectados"
          description="Visitantes activos en la tienda ahora mismo"
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Actualizado: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchOnline}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowClockwise24Regular className="size-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Circle20Filled className="size-3 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-400">
              {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Circle20Filled className="size-10 mb-3 opacity-20" />
          <p className="text-sm">No hay usuarios conectados en este momento</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((entry) => {
            const u = entry.users;
            const initials =
              `${u.first_name[0] ?? ''}${u.last_name[0] ?? ''}`.toUpperCase();
            return (
              <div
                key={entry.user_id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="relative">
                  <Avatar className="size-10">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-background" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {u.first_name} {u.last_name}
                    </span>
                    <Badge variant={roleBadgeVariant(u.roles?.name ?? '')} className="text-xs py-0">
                      {u.roles?.name ?? 'CLIENT'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                <div className="text-right shrink-0">
                  {entry.current_page && (
                    <p className="text-xs text-muted-foreground truncate max-w-40 text-right">
                      {entry.current_page}
                    </p>
                  )}
                  <p className="text-xs text-green-500/80">{timeSince(entry.last_seen)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
