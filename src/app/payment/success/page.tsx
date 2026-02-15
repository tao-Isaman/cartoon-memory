'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCreditBalance } from '@/contexts/CreditBalanceContext';
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-primary" size={48} />
          <p className="mt-4 text-foreground/60">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refresh } = useCreditBalance();
  const [verifying, setVerifying] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setVerifying(false);
      setError(true);
      return;
    }

    fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, type: 'credits' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCredits(data.credits);
          refresh();
        } else if (data.status === 'unpaid') {
          // PromptPay pending
          setCredits(null);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setVerifying(false));
  }, [sessionId, refresh]);

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-primary" size={48} />
          <p className="mt-4 text-foreground/60">กำลังตรวจสอบการชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <p className="text-lg font-medium text-error">เกิดข้อผิดพลาด</p>
          <p className="mt-2 text-sm text-foreground/60">ไม่สามารถตรวจสอบการชำระเงินได้</p>
          <Link
            href="/credits"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            กลับไปหน้าเครดิต
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">
        <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-full bg-success/10 p-4">
          <CheckCircle size={48} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold">ชำระเงินสำเร็จ!</h1>
        {credits ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-secondary/10 px-4 py-3">
            <Sparkles className="text-secondary" size={20} />
            <span className="text-lg font-semibold">+{credits.toLocaleString()} เครดิต</span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-foreground/60">
            รอการยืนยันจาก PromptPay เครดิตจะเพิ่มอัตโนมัติเมื่อชำระเงินสำเร็จ
          </p>
        )}
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          เริ่มสร้างการ์ตูน
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
