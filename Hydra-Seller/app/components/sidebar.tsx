'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Grid24Regular,
  Cart24Regular,
  Box24Regular,
  SignOut24Regular,
  Navigation24Regular,
  Dismiss24Regular,
  Person24Regular,
  Wallet24Regular,
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { NotificationDropdown } from './notifications/NotificationDropdown';
import { useAuth } from '@/hooks/use-auth';

const navSections = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: Grid24Regular }],
  },
  {
    label: 'Catalog',
    items: [{ href: '/dashboard/products', label: 'Products', icon: Box24Regular }],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/orders', label: 'Orders', icon: Cart24Regular },
      { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet24Regular },
    ],
  },
  {
    label: 'Account',
    items: [{ href: '/dashboard/profile', label: 'Profile', icon: Person24Regular }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user: authUser, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<{
    name?: string;
    email?: string;
    avatarUrl?: string;
    picture?: string;
  } | null>(null);

  useEffect(() => {
    if (authUser) {
      const firstName = authUser.first_name || '';
      const lastName = authUser.last_name || '';
      const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        authUser.email ||
        'User';

      setUser({
        name: fullName,
        email: authUser.email || '',
        avatarUrl: authUser.avatar_url || '',
      });
    }
  }, [authUser]);

  const prevPathname = useRef(pathname);
  if (pathname !== prevPathname.current) {
    prevPathname.current = pathname;
    setIsMobileOpen(false);
  }

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    await logout();
  };

  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
            <div className="relative size-10 shrink-0 flex items-center justify-center rounded-2xl bg-primary/[0.03] border border-primary/10 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:border-primary/20 group-hover:shadow-primary/5">
              <Image
                src="/cat.png"
                alt="Hydra Logo"
                width={32}
                height={32}
                className="size-8 object-contain transition-transform duration-500 group-hover:scale-110"
                priority
                unoptimized
              />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black tracking-tight leading-none font-display text-sidebar-foreground">
                Hydra
              </div>
              <p className="text-[10px] uppercase font-bold text-sidebar-foreground/40 mt-1">
                Seller Panel
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              <Dismiss24Regular className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <h3 className="text-[10px] uppercase font-bold text-sidebar-foreground/40 tracking-widest mb-2 px-3">
              {section.label}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {user && (
        <div className="p-4 sm:p-6 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <SignOut24Regular className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">{sidebarContent}</div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-30 lg:hidden bg-background/80 backdrop-blur-sm border border-border text-foreground hover:text-primary transition-colors"
        onClick={() => setIsMobileOpen(true)}
      >
        <Navigation24Regular className="size-5" />
      </Button>
    </>
  );
}
