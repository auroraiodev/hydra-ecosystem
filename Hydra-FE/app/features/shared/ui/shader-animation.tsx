'use client';

import { useEffect, useRef } from 'react';

export function ShaderAnimation() {
  const mounted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      mounted.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted.current) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-10">
      {/* Holographic Interference Layer (Rainbow) */}
      <div
        className="absolute inset-[-100%] size-[300%] animate-holo-shift opacity-30 mix-blend-color-dodge"
        style={{
          background: `linear-gradient(
            115deg, 
            transparent 35%, 
            #ff0080 42%, 
            #00ff00 47%, 
            #0080ff 52%, 
            transparent 60%
          )`,
        }}
      />

      {/* Glossy Sheen Layer (White) */}
      <div
        className="absolute inset-[-100%] size-[300%] animate-sheen-slide opacity-20 mix-blend-plus-lighter"
        style={{
          background: `linear-gradient(
                105deg,
                transparent 40%,
                rgba(255, 255, 255, 0.8) 48%,
                rgba(255, 255, 255, 0.0) 52%,
                transparent 60%
            )`,
        }}
      />
    </div>
  );
}
