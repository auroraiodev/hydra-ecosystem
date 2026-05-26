'use client';

import { FlowButton } from '@/features/shared/ui/flow-button';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="vault-glass-panel p-8 lg:p-12 max-w-xl w-full crystal-shadow rounded-[3rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="size-20 bg-teal/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-teal">
            <span className="text-4xl">🛠️</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-semibold text-vault-text mb-4 tracking-tighter uppercase leading-none">
            Algo <br />
            <span className="text-teal">salió mal</span>
          </h1>

          <p className="text-vault-text-muted text-lg font-medium mb-10 max-w-md mx-auto">
            Ocurrió un error inesperado al procesar tu solicitud. Por favor intenta de nuevo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <FlowButton
              variant="default"
              onClick={reset}
              className="rounded-2xl px-8 py-4 font-bold text-lg shadow-xl shadow-teal/20"
            >
              Intentar de nuevo
            </FlowButton>

            <FlowButton
              variant="vault"
              onClick={() => (window.location.href = '/')}
              className="rounded-2xl px-8 py-4 font-bold text-lg"
            >
              Volver al Inicio
            </FlowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
