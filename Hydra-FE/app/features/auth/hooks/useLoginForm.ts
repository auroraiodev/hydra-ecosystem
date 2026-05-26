import { useState, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useToastContext } from '@/features/shared/components/ToastProvider';

export function useLoginForm(redirectTo?: string | null) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { push } = useRouter();
  const { login } = useAuth();
  const { success, error: showError } = useToastContext();

  const hasNotified = useRef(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isPending) return;

      startTransition(async () => {
        hasNotified.current = false;

        try {
          await login({ email, password });

          if (!hasNotified.current) {
            success('¡Inicio de sesión exitoso! Bienvenido de nuevo.');
            hasNotified.current = true;
          }

          push(redirectTo || '/');
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión';
          showError(errorMessage);
        }
      });
    },
    [email, password, login, push, success, showError, redirectTo, isPending]
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
    isLoading: isPending,
    handleSubmit,
  };
}
