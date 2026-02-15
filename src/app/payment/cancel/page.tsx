'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">
        <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-full bg-error/10 p-4">
          <XCircle size={48} className="text-error" />
        </div>
        <h1 className="text-2xl font-bold">ยกเลิกการชำระเงิน</h1>
        <p className="mt-2 text-sm text-foreground/60">
          คุณได้ยกเลิกการชำระเงิน ไม่มีการเรียกเก็บเงิน
        </p>
        <Link
          href="/credits"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          กลับไปหน้าเครดิต
        </Link>
      </div>
    </div>
  );
}
