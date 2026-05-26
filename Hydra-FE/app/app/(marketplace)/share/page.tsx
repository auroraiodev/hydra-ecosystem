'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ShareContent() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const title = searchParams.get('title') || '';
  const text = searchParams.get('text') || '';
  const url = searchParams.get('url') || '';

  const redirectTarget = (() => {
    if (url) {
      try {
        const parsed = new URL(url);
        // If it's a link to our own site, redirect there
        if (parsed.pathname && parsed.pathname !== '/') {
          return parsed.pathname + parsed.search;
        }
      } catch {
        // Not a valid URL — fall through to search
      }
    }

    // If there's a title or text, search for it
    const query = title || text;
    if (query) {
      return `/singles/search?query=${encodeURIComponent(query)}`;
    }
    return null;
  })();

  if (redirectTarget) {
    replace(redirectTarget);
  }

  if (redirectTarget) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Contenido compartido</h1>
        {title && <p className="font-medium mb-1">{title}</p>}
        {text && <p className="text-muted-foreground mb-1">{text}</p>}
        {url && (
          <a href={url} className="text-primary underline break-all">
            {url}
          </a>
        )}
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Redirigiendo…</p>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
