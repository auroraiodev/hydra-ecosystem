/** @jsxImportSource react */
'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/hooks/use-login-form';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { sanitizeUrlError } from '@/lib/sanitize';
import { FcGoogle } from 'react-icons/fc';
import { Spinner } from '@/components/ui/spinner';

export function LoginPageContentInner() {
  const { push } = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    error: formError,
    isLoading,
    handleSubmit,
  } = useLoginForm();
  const { initiateGoogleAuth, isLoading: oauthLoading } = useGoogleAuth();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/auth-session', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user?.role?.toUpperCase() === 'ADMIN') {
            const params = new URLSearchParams(window.location.search);
            const redirectParam = params.get('redirect');
            push(redirectParam || '/dashboard');
          }
        }
      } catch {
        // ignore and stay on login
      }
    };

    checkSession();
  }, [push]);

  const error = formError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans text-foreground">
      {/* Dynamic background layers using primary accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb,15,108,189),0.04),transparent_50%)]" />
      <div className="absolute top-0 right-0 size-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 size-[500px] bg-primary/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />
      
      {/* Mesh grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(var(--foreground) 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-md relative z-10">
        <Card className="border border-border bg-card shadow-lg rounded-[var(--radius,0.375rem)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
          
          <CardHeader className="space-y-4 text-center pt-10 pb-4">
            {/* Mascot with subtle glow */}
            <div className="flex justify-center mb-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
                <div className="relative z-10 p-1 bg-card rounded-[var(--radius,0.375rem)] border border-border">
                  <Image
                    src="/cat.png"
                    alt="Hydra Admin"
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground uppercase">
                <span className="text-primary">Hydra</span> Admin
              </CardTitle>
              <CardDescription className="text-muted-foreground font-semibold tracking-tight text-xs uppercase">
                Panel de Gestión del Marketplace MTG
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-[var(--radius,0.375rem)] border-border bg-background hover:bg-muted text-foreground transition-all duration-300 font-bold group"
                onClick={(e) => {
                  e.preventDefault();
                  initiateGoogleAuth();
                }}
                disabled={isLoading || !!oauthLoading}
              >
                {oauthLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <FcGoogle className="mr-3 size-5 group-hover:scale-110 transition-transform" />
                )}
                <span>Continue with Google</span>
              </Button>

              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  O accede con email
                </span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2" suppressHydrationWarning>
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-background border-input rounded-[var(--radius,0.375rem)] focus-visible:ring-primary focus-visible:border-primary text-foreground placeholder:text-muted-foreground/50"
                    autoComplete="email"
                    required
                  />
                </div>
                
                <div className="space-y-2" suppressHydrationWarning>
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-background border-input rounded-[var(--radius,0.375rem)] focus-visible:ring-primary focus-visible:border-primary text-foreground placeholder:text-muted-foreground/50 pr-12"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-[var(--radius,0.375rem)]">
                    {sanitizeUrlError(error)}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-wider rounded-[var(--radius,0.375rem)] shadow-sm transition-all duration-300"
                  disabled={isLoading || !!oauthLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2 text-primary-foreground" />
                      <span>Verificando…</span>
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
        
        {/* Subtle footer */}
        <p className="text-center mt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/45">
          Hydra Protocol &copy; 2026
        </p>
      </div>
    </div>
  );
}
