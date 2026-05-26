import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description:
    'La página que buscas no existe o fue movida. Explora nuestro catálogo de cartas Magic: The Gathering en México.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-semibold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
        Página no encontrada
      </h2>
      <p className="text-zinc-800 dark:text-zinc-200 mb-8 max-w-md">
        La página que buscas no existe o fue movida. Explora nuestro catálogo de cartas Magic: The
        Gathering.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
        >
          Ir al inicio
        </Link>
        <Link
          href="/singles"
          className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-full font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Ver singles
        </Link>
      </div>
    </div>
  );
}
