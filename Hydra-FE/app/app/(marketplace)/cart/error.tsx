'use client';

import { FlowButton } from '@/features/shared/ui/flow-button';

export default function CartError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 py-12 text-center">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-8 max-w-md w-full">
        <div className="text-4xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
          Error al cargar el carrito
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
          No se pudo cargar tu carrito. Intenta de nuevo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <FlowButton
            variant="default"
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity h-auto"
          >
            Reintentar
          </FlowButton>
          <FlowButton
            variant="outline"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors h-auto"
          >
            Refrescar página
          </FlowButton>
        </div>
      </div>
    </div>
  );
}
