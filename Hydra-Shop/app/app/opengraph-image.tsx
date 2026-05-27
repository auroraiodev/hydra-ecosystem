import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Node.js runtime so we can read assets from disk — avoids fragile HTTP self-fetch on Edge
export const alt = 'Hydra Collectables - Magic The Gathering México';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function toDataUri(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export default async function Image(): Promise<ImageResponse> {
  let catSrc = '';
  try {
    catSrc = toDataUri(readFileSync(join(process.cwd(), 'public', 'cat.png')), 'image/png');
  } catch {}

  const logo = catSrc ? (
    /* eslint-disable @next/next/no-img-element */
    <img
      src={catSrc}
      alt="Hydra"
      style={{
        width: 108,
        height: 108,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #148a81',
        boxShadow: '0 0 48px rgba(20,138,129,0.6)',
      }}
    />
    /* eslint-enable @next/next/no-img-element */
  ) : (
    <div
      style={{
        width: 108,
        height: 108,
        borderRadius: '50%',
        background: '#148a81',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: 56, color: '#fff', fontWeight: 800 }}>H</span>
    </div>
  );

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#080c10',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(20,138,129,0.22) 0%, transparent 70%)',
          display: 'flex',
        }}
      />
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: 'linear-gradient(180deg, #148a81, #0d9488, #148a81)',
          display: 'flex',
        }}
      />
      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 80px',
          gap: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', marginBottom: 28 }}>{logo}</div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#f1f5f9',
            lineHeight: 1.05,
            textAlign: 'center',
            letterSpacing: '-1.5px',
            display: 'flex',
          }}
        >
          Hydra Collectables
        </div>

        {/* Teal divider */}
        <div
          style={{
            width: 64,
            height: 3,
            background: '#148a81',
            borderRadius: 2,
            marginTop: 18,
            marginBottom: 18,
            display: 'flex',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#5eead4',
            textAlign: 'center',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          La Tienda #1 de Magic: The Gathering en México
        </div>

        {/* Pills */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 26,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {['Singles MTG', 'Commander', 'Modern', 'Sellado', 'Envíos MX'].map((label) => (
            <div
              key={label}
              style={{
                padding: '7px 18px',
                background: 'rgba(20,138,129,0.15)',
                border: '1px solid rgba(20,138,129,0.45)',
                borderRadius: 999,
                color: '#99f6e4',
                fontSize: 17,
                fontWeight: 500,
                display: 'flex',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 19,
            color: 'rgba(255,255,255,0.35)',
            marginTop: 26,
            letterSpacing: '0.5px',
            display: 'flex',
          }}
        >
          hydracollect.com
        </div>
      </div>

      {/* Bottom teal bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, transparent, #148a81, #0d9488, #148a81, transparent)',
          display: 'flex',
        }}
      />
    </div>,
    { ...size }
  );
}
