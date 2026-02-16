import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ - สร้างรูปการ์ตูน AI',
  description:
    'เข้าสู่ระบบ Cartoon Gen เพื่อสร้างรูปการ์ตูน วาดรูปการ์ตูนออนไลน์ เปลี่ยนรูปเป็นการ์ตูนด้วย AI',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
