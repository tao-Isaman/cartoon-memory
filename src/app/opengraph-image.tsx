import { ImageResponse } from 'next/og';

export const alt = 'Cartoon Gen - สร้างรูปการ์ตูน AI';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #fff5f7 0%, #ffe4e6 30%, #fecdd3 60%, #fda4af 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(232, 82, 122, 0.15)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(244, 114, 182, 0.12)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 200,
            right: 150,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(251, 113, 133, 0.1)',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '40px 60px',
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 90,
              height: 90,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #e8527a 0%, #f472b6 100%)',
              marginBottom: 30,
              boxShadow: '0 8px 30px rgba(232, 82, 122, 0.3)',
            }}
          >
            <span style={{ fontSize: 52, color: 'white', fontWeight: 700 }}>C</span>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: '#e8527a',
                lineHeight: 1.2,
              }}
            >
              Cartoon Gen
            </span>
            <span
              style={{
                fontSize: 34,
                fontWeight: 600,
                color: '#9f1239',
                lineHeight: 1.3,
                marginTop: 4,
              }}
            >
              สร้างรูปการ์ตูน AI
            </span>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: 22,
              color: '#be185d',
              marginTop: 20,
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: 700,
            }}
          >
            เปลี่ยนรูปถ่ายเป็นการ์ตูนสุดน่ารัก วาดรูปการ์ตูนออนไลน์ด้วย AI
          </span>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 36,
            }}
          >
            {['หลายสไตล์', 'ไม่มีลายน้ำ', 'ได้ผลทันที'].map((text) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 24px',
                  borderRadius: 50,
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1.5px solid rgba(232, 82, 122, 0.25)',
                  fontSize: 18,
                  color: '#be185d',
                  fontWeight: 500,
                }}
              >
                {text}
              </div>
            ))}
          </div>

          {/* URL */}
          <span
            style={{
              position: 'absolute',
              bottom: 28,
              fontSize: 16,
              color: '#f472b6',
              fontWeight: 500,
            }}
          >
            cartoon-gen.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
