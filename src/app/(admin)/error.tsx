'use client';

import { AlertCircle } from 'lucide-react';

export default function AdminError({
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
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          เกิดข้อผิดพลาดในระบบแอดมิน
        </h2>
        <p className="mt-2 text-sm text-foreground/50">
          {error.message || 'กรุณาลองอีกครั้ง'}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  );
}
