import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';

export const runtime = 'edge';
export const alt = 'Hydra Collectables - Magic The Gathering México';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CONTAINER_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
};

const LOGO_CIRCLE_STYLE: React.CSSProperties = {
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #135bec, #4f8ffc)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 30,
  boxShadow: '0 0 60px rgba(19, 91, 236, 0.4)',
  overflow: 'hidden',
};

export default async function Image(): Promise<ImageResponse> {
  const siteUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://hydracollect.com';
  const catUrl: string = `${siteUrl}/cat.png`;

  let catSrc: string = '';
  try {
    const catRes: Response = await fetch(catUrl);
    if (catRes.ok) {
      const catBuffer: ArrayBuffer = await catRes.arrayBuffer();
      const base64: string = btoa(
        new Uint8Array(catBuffer).reduce(
          (data: string, byte: number) => data + String.fromCharCode(byte),
          ''
        )
      );
      catSrc = `data:image/png;base64,${base64}`;
    }
  } catch {
    // fallback to text logo
  }

  const logoElement: ReactElement = catSrc ? (
    /* OG image rendered by Satori — only supports <img>, next/image is incompatible */
    /* eslint-disable @next/next/no-img-element */
    /* oxlint-disable react-doctor/nextjs-no-img-element */
    <img
      src={catSrc}
      alt="Hydra"
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
  ) : (
    /* oxlint-enable react-doctor/nextjs-no-img-element */
    /* eslint-enable @next/next/no-img-element */
    <span
      style={{
        fontSize: 60,
        color: 'white',
        fontWeight: 800,
      }}
    >
      H
    </span>
  );

  return new ImageResponse(
    <div style={CONTAINER_STYLE}>
      {/* Logo circle */}
      <div style={LOGO_CIRCLE_STYLE}>{logoElement}</div>
      {/* Title */}
      <h1
        style={{
          fontSize: 64,
          fontWeight: 600,
          color: 'white',
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        Hydra Collectables
      </h1>
      {/* Subtitle */}
      <p
        style={{
          fontSize: 28,
          color: '#93c5fd',
          margin: '16px 0 0 0',
          textAlign: 'center',
        }}
      >
        Magic: The Gathering en México
      </p>
      {/* Tagline */}
      <p
        style={{
          fontSize: 20,
          color: '#9ca3af',
          margin: '12px 0 0 0',
          textAlign: 'center',
        }}
      >
        Compra y vende cartas · Singles · Productos sellados · Envíos a todo México
      </p>
      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #135bec, #4f8ffc, #135bec)',
        }}
      />
    </div>,
    { ...size }
  );
}
