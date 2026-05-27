'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { presenceAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Circle20Filled,
  ArrowClockwise24Regular,
  Shield24Regular,
  History24Regular,
  PeopleTeam24Regular,
  Delete24Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';

type Tab = 'live' | 'history' | 'blocked';

interface OnlineUser {
  user_id: string;
  last_seen: string;
  current_page: string | null;
  ip_address: string | null;
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

interface VisitEntry {
  id: string;
  user_id: string;
  page: string;
  ip_address: string | null;
  visited_at: string;
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

interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string | null;
  created_at: string;
}

interface BlockedUser {
  id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    avatar_url: string | null;
  };
}

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  return `hace ${Math.floor(seconds / 60)}m`;
}

function roleBadgeVariant(role: string) {
  if (role === 'ADMIN') return 'destructive' as const;
  if (role === 'SELLER') return 'secondary' as const;
  return 'outline' as const;
}

function UserRow({ u }: { u: OnlineUser['users'] }) {
  const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={u.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live tab
// ---------------------------------------------------------------------------
function LiveTab() {
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

  const handleBlock = async (entry: OnlineUser) => {
    const { ip_address, user_id } = entry;
    try {
      const calls: Promise<any>[] = [];
      if (ip_address) calls.push(presenceAPI.blockIp({ ip: ip_address, reason: 'Blocked from live view' }));
      calls.push(presenceAPI.blockUser({ userId: user_id, reason: 'Blocked from live view' }));
      await Promise.all(calls);
      toast.success(`Usuario${ip_address ? ' e IP' : ''} bloqueado(s)`);
    } catch {
      toast.error('Error al bloquear');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
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
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <Circle20Filled className="size-3 text-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-400">
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
          </span>
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
            return (
              <div
                key={entry.user_id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="relative">
                  <Avatar className="size-10">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {`${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase()}
                    </AvatarFallback>
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

                <div className="text-right shrink-0 space-y-0.5">
                  {entry.current_page && (
                    <p className="text-xs text-muted-foreground truncate max-w-40 text-right">
                      {entry.current_page}
                    </p>
                  )}
                  {entry.ip_address && (
                    <p className="text-xs text-muted-foreground/60 font-mono">{entry.ip_address}</p>
                  )}
                  <p className="text-xs text-green-500/80">{timeSince(entry.last_seen)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                  title="Bloquear usuario (+ IP si disponible)"
                  onClick={() => handleBlock(entry)}
                >
                  <Shield24Regular className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// History tab
// ---------------------------------------------------------------------------
function HistoryTab() {
  const [visits, setVisits] = useState<VisitEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const [filters, setFilters] = useState({
    userId: '',
    page: '',
    ip: '',
    from: '',
    to: '',
  });

  const loadHistory = useCallback(async (overridePage?: number) => {
    setLoading(true);
    try {
      const p = overridePage ?? page;
      const data = await presenceAPI.getHistory({
        userId: filters.userId || undefined,
        page: filters.page || undefined,
        ip: filters.ip || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        limit: PAGE_SIZE,
        offset: p * PAGE_SIZE,
      });
      const result = data?.data ?? data;
      setVisits(result?.visits ?? []);
      setTotal(result?.total ?? 0);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(0);
    loadHistory(0);
  };

  const handleBlock = async (v: VisitEntry) => {
    try {
      const calls: Promise<any>[] = [];
      if (v.ip_address) calls.push(presenceAPI.blockIp({ ip: v.ip_address, reason: 'Blocked from history' }));
      calls.push(presenceAPI.blockUser({ userId: v.user_id, reason: 'Blocked from history' }));
      await Promise.all(calls);
      toast.success(`Usuario${v.ip_address ? ' e IP' : ''} bloqueado(s)`);
    } catch {
      toast.error('Error al bloquear');
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <Input
          placeholder="Página (URL)"
          value={filters.page}
          onChange={(e) => setFilters((f) => ({ ...f, page: e.target.value }))}
          className="h-8 text-xs"
        />
        <Input
          placeholder="IP"
          value={filters.ip}
          onChange={(e) => setFilters((f) => ({ ...f, ip: e.target.value }))}
          className="h-8 text-xs font-mono"
        />
        <Input
          placeholder="User ID"
          value={filters.userId}
          onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
          className="h-8 text-xs"
        />
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="h-8 text-xs"
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="h-8 text-xs"
        />
      </div>
      <Button size="sm" onClick={handleSearch} className="mb-4 gap-2">
        <Search24Regular className="size-4" />
        Buscar
      </Button>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <History24Regular className="size-10 mb-3 opacity-20" />
          <p className="text-sm">Sin resultados</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">{total} visitas encontradas</p>
          <div className="space-y-2">
            {visits.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <UserRow u={v.users} />

                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs truncate text-muted-foreground max-w-xs ml-auto">
                    {v.page}
                  </p>
                  {v.ip_address && (
                    <p className="text-xs text-muted-foreground/60 font-mono">{v.ip_address}</p>
                  )}
                  <p className="text-xs text-muted-foreground/40">
                    {new Date(v.visited_at).toLocaleString()}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                  title="Bloquear usuario (+ IP si disponible)"
                  onClick={() => handleBlock(v)}
                >
                  <Shield24Regular className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Blocked tab — IPs and Users with manual add
// ---------------------------------------------------------------------------
type BlockView = 'ips' | 'users';

function BlockedTab() {
  const [view, setView] = useState<BlockView>('users');
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [newIp, setNewIp] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newReason, setNewReason] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ipData, userData] = await Promise.all([
        presenceAPI.getBlockedIps(),
        presenceAPI.getBlockedUsers(),
      ]);
      setIps(Array.isArray(ipData) ? ipData : (ipData?.data ?? []));
      setUsers(Array.isArray(userData) ? userData : (userData?.data ?? []));
    } catch {
      toast.error('Error al cargar bloqueados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async () => {
    const ip = newIp.trim();
    const userId = newUserId.trim();
    if (!ip && !userId) return;
    try {
      const calls: Promise<any>[] = [];
      if (ip) calls.push(presenceAPI.blockIp({ ip, reason: newReason.trim() || undefined }));
      if (userId) calls.push(presenceAPI.blockUser({ userId, reason: newReason.trim() || undefined }));
      await Promise.all(calls);
      toast.success(`Bloqueado: ${[ip, userId].filter(Boolean).join(' / ')}`);
      setNewIp(''); setNewUserId(''); setNewReason('');
      fetchAll();
    } catch {
      toast.error('Error al bloquear');
    }
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      await presenceAPI.unblockIp(ip);
      toast.success(`IP ${ip} desbloqueada`);
      setIps((prev) => prev.filter((i) => i.ip_address !== ip));
    } catch { toast.error('Error al desbloquear'); }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await presenceAPI.unblockUser(userId);
      toast.success('Usuario desbloqueado');
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch { toast.error('Error al desbloquear'); }
  };

  return (
    <>
      {/* Add form */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-6 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Añadir bloqueo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="IP (opcional)"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="h-9 text-sm font-mono"
          />
          <Input
            placeholder="User ID (opcional)"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            className="h-9 text-sm font-mono"
          />
          <Input
            placeholder="Razón (opcional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={!newIp.trim() && !newUserId.trim()} className="gap-2">
          <Shield24Regular className="size-4" />
          Bloquear
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/5 w-fit text-sm">
        {(['users', 'ips'] as BlockView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'px-3 py-1.5 rounded-md font-medium transition-all',
              view === v ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {v === 'users' ? `Usuarios (${users.length})` : `IPs (${ips.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : view === 'ips' ? (
        ips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield24Regular className="size-10 mb-3 opacity-20" />
            <p className="text-sm">No hay IPs bloqueadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ips.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <Shield24Regular className="size-5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium">{item.ip_address}</p>
                  {item.reason && <p className="text-xs text-muted-foreground truncate">{item.reason}</p>}
                  <p className="text-xs text-muted-foreground/40">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleUnblockIp(item.ip_address)}>
                  <Delete24Regular className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )
      ) : (
        users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield24Regular className="size-10 mb-3 opacity-20" />
            <p className="text-sm">No hay usuarios bloqueados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((item) => {
              const u = item.users;
              const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-destructive/10 text-destructive">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {item.reason && <p className="text-xs text-muted-foreground/60 truncate">{item.reason}</p>}
                    <p className="text-xs text-muted-foreground/40">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnblockUser(item.user_id)}>
                    <Delete24Regular className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'live', label: 'En Vivo', icon: PeopleTeam24Regular },
  { id: 'history', label: 'Historial', icon: History24Regular },
  { id: 'blocked', label: 'Bloqueados', icon: Shield24Regular },
];

export default function PresenceContent() {
  const [tab, setTab] = useState<Tab>('live');

  return (
    <PageLayout>
      <div className="mb-6">
        <PageHeader
          title="Presencia"
          description="Monitoreo de usuarios activos, historial de visitas y control de acceso por IP"
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              tab === id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'live' && <LiveTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'blocked' && <BlockedTab />}
    </PageLayout>
  );
}
