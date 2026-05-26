import { useState, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/lib/api';
import { useToastContext } from '@/features/shared/components/ToastProvider';

export function useSignupForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { push } = useRouter();
  const { success, error: showError } = useToastContext();

  const hasNotified = useRef(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!termsAccepted) {
        showError('Debes aceptar los Términos y Condiciones para continuar');
        return;
      }

      if (!firstName.trim()) {
        showError('El nombre es requerido');
        return;
      }

      if (!lastName.trim()) {
        showError('El apellido es requerido');
        return;
      }

      startTransition(async () => {
        try {
          await signup({
            username,
            email,
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });

          if (!hasNotified.current) {
            success('¡Cuenta creada exitosamente! Por favor inicia sesión.');
            hasNotified.current = true;
          }

          push('/login');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error al crear la cuenta';
          showError(errorMessage);
        }
      });
    },
    [username, email, password, firstName, lastName, termsAccepted, push, success, showError]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    showPassword,
    togglePasswordVisibility,
    termsAccepted,
    setTermsAccepted,
    isLoading: isPending,
    handleSubmit,
  };
}
