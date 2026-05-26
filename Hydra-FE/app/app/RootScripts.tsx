import Script from 'next/script';
import { JsonLd } from '@/features/shared/components/JsonLd';

interface RootScriptsProps {
  jsonLd: Record<string, unknown>;
}

export function RootScripts({ jsonLd }: RootScriptsProps) {
  return (
    <>
      <Script id="trusted-types" strategy="beforeInteractive">
        {`
            if (window.trustedTypes && window.trustedTypes.createPolicy && !window.trustedTypes.defaultPolicy) {
              window.trustedTypes.createPolicy('default', {
                createHTML: (s) => s,
                createScriptURL: (s) => s,
                createScript: (s) => s,
              });
            }
          `}
      </Script>
      <Script id="theme-init" strategy="beforeInteractive">
        {`
            try {
              const t = localStorage.getItem('theme') || 'dark';
              if (t === 'dark') document.documentElement.classList.add('dark');
            } catch(e){}
          `}
      </Script>
      <JsonLd id="json-ld" data={jsonLd} />
    </>
  );
}
