'use client';

import { useRef, useState, useCallback, type MouseEvent } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

interface Use3DTiltReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
  onMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

export function use3DTilt(intensity: number = 10): Use3DTiltReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, scale: 1 });

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;
      setTilt({ rotateX, rotateY, scale: 1.05 });
    },
    [intensity]
  );

  const onMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  const style: React.CSSProperties = {
    transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
    transition: 'transform 0.3s ease-out',
    transformStyle: 'preserve-3d',
  };

  return { ref, style, onMouseMove, onMouseLeave };
}
