import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CSV Excel Converter - Convert CSV, JSON, Excel Online';
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #16213e 0%, transparent 50%)',
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
            <line x1="8" y1="9" x2="10" y2="9" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          CSV Excel Converter
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#a1a1aa',
            marginBottom: 30,
            textAlign: 'center',
          }}
        >
          Convert, Transform & Preview Your Data Files
        </div>

        {/* Format badges */}
        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          {['CSV', 'JSON', 'Excel', 'XML', 'SQL'].map((format) => (
            <div
              key={format}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                backgroundColor: '#1f2937',
                borderRadius: 6,
                border: '1px solid #374151',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#3b82f6',
                }}
              >
                {format}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
