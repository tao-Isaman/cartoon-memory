import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="font-[family-name:var(--font-display)] text-6xl text-primary">404</p>
        <h2 className="mt-4 text-xl font-bold">ไม่พบหน้าที่ต้องการ</h2>
        <p className="mt-2 text-sm text-foreground/60">
          หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือไม่มีอยู่
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Home size={16} />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
