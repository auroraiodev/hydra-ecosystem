'use client';

interface JsonLdProps {
  id: string;
  data: Record<string, unknown>;
}

export function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script id={id} type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  );
}
