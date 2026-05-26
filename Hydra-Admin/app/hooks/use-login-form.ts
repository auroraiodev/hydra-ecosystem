'use client';

import { useState, useCallback, useRef, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { sanitizeUrlError } from '@/lib/sanitize';

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const hasNotified = useRef(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isPending) return;

      setError('');
      hasNotified.current = false;

      startTransition(async () => {
        try {
          const response = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Login failed');
          }

          const data = await response.json();

          if (data.user) {
            const redirectParam = searchParams.get('redirect');
            // Always stay within the admin app — never redirect cross-app from the login form.
            const redirectUrl =
              redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';

            if (!hasNotified.current) {
              toast.success('¡Inicio de sesión exitoso! Bienvenido de nuevo.');
              hasNotified.current = true;
            }

            window.location.href = redirectUrl;
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión';
          setError(sanitizeUrlError(message));
        }
      });
    },
    [email, password, searchParams, isPending]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    error,
    isLoading: isPending,
    handleSubmit,
  };
}
