'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle size={48} className="mx-auto text-error" />
        <h2 className="mt-4 text-xl font-bold">เกิดข้อผิดพลาด</h2>
        <p className="mt-2 text-sm text-foreground/60">
          {error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <RotateCcw size={16} />
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  );
}
