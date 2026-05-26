'use client';

import type React from 'react';

import { useState, useEffect, Suspense, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLoginForm } from '@/hooks/use-login-form';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { sanitizeUrlError } from '@/lib/sanitize';
import { FcGoogle } from 'react-icons/fc';
import { Spinner } from '@/components/ui/spinner';

import Image from 'next/image';

function LoginPageContentInner() {
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
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

  const [error, setError] = useState('');

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(sanitizeUrlError(urlError));
    }
  }, [searchParams]);

  const displayError = formError || error;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 size-[600px] bg-gradient-to-bl from-primary/8 via-primary/4 to-transparent rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 size-[500px] bg-gradient-to-tr from-primary/6 to-transparent rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      <Card className="w-full max-w-md shadow-[0_20px_60px_rgba(20,138,129,0.08)] border-primary/15 relative z-10">
        <CardHeader className="space-y-3 text-center pb-2">
          {/* Cat mascot logo */}
          <div className="flex justify-center mb-2">
            <div className="relative size-20">
              <div className="absolute inset-0 bg-primary/15 rounded-full blur-[40px] scale-150" />
              <Image
                src="/cat.png"
                alt="Hydra Seller"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain relative z-10 drop-shadow-[0_10px_30px_rgba(20,138,129,0.2)]"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            <span className="text-primary">Hydra</span> Seller
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Panel de Vendedor del Marketplace MTG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 sm:h-11"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                initiateGoogleAuth();
              }}
              disabled={isLoading || !!oauthLoading}
            >
              {oauthLoading ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  <span>Cargando…</span>
                </>
              ) : (
                <>
                  <FcGoogle className="mr-2 size-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Continue with Google</span>
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vendedor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-10 sm:h-11"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
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
                  className="h-10 sm:h-11 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            {displayError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {sanitizeUrlError(displayError)}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-10 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_20px_rgba(20,138,129,0.2)] hover:shadow-[0_6px_30px_rgba(20,138,129,0.3)] transition-all duration-300"
              disabled={isLoading || !!oauthLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoginPageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner size="large" />
        </div>
      }
    >
      <LoginPageContentInner />
    </Suspense>
  );
}
