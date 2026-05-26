import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const OG_CONTAINER_STYLE: React.CSSProperties = {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0f172a',
  backgroundImage:
    'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
  backgroundSize: '100px 100px',
  color: 'white',
  fontFamily: 'sans-serif',
  padding: '40px',
};

const OG_LOGO_BOX_STYLE: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  backgroundColor: '#3b82f6',
  marginRight: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '24px',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get params
    const title = searchParams.get('title') || 'Hydra Collectables México';
    const price = searchParams.get('price');
    const imageUrl = searchParams.get('imageUrl');
    const expansion = searchParams.get('expansion');

    // oxlint-disable react-doctor/nextjs-no-img-element
    /* eslint-disable @next/next/no-img-element */
    return new ImageResponse(
      <div style={OG_CONTAINER_STYLE}>
        {/* Logo/Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={OG_LOGO_BOX_STYLE}>H</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '-0.05em' }}>
              HYDRA COLLECTABLES
            </div>
          </div>
          {expansion && <div style={{ fontSize: '24px', color: '#94a3b8' }}>{expansion}</div>}
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '40px' }}>
          {/* Card Image */}
          {imageUrl && (
            <div
              style={{
                display: 'flex',
                position: 'relative',
                width: '300px',
                height: '420px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* OG image rendered by Satori — only supports <img>, next/image is incompatible */}
              <img
                src={imageUrl}
                alt={title}
                style={{ width: '300px', height: '420px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Content info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                lineHeight: 1.1,
                marginBottom: '24px',
                color: 'white',
              }}
            >
              {title}
            </h1>

            {price && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '24px', color: '#94a3b8' }}>Precio:</span>
                <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {price}
                </span>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '100px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  fontSize: '18px',
                  color: '#cbd5e1',
                }}
              >
                Magic: The Gathering
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '100px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  fontSize: '18px',
                  color: '#cbd5e1',
                }}
              >
                México
              </div>
            </div>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
    /* eslint-enable @next/next/no-img-element */
    // oxlint-enable react-doctor/nextjs-no-img-element
  } catch (e: unknown) {
    console.log(`${e instanceof Error ? e.message : String(e)}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
