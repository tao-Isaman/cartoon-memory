import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cartoon Gen - สร้างรูปการ์ตูน AI',
    short_name: 'Cartoon Gen',
    description: 'สร้างรูปการ์ตูนจากรูปถ่ายด้วย AI วาดรูปการ์ตูนออนไลน์ เปลี่ยนรูปเป็นการ์ตูนสุดน่ารัก',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff5f7',
    theme_color: '#e8527a',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
