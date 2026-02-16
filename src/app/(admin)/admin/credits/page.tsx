'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Coins, Loader2, CheckCircle } from 'lucide-react';

export default function AdminCreditsPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    email: string;
    previousBalance: number;
    newBalance: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credits = parseInt(amount, 10);
    if (!email || !credits || credits <= 0) {
      showToast('กรุณากรอกอีเมลและจำนวนเครดิตที่ถูกต้อง', 'error');
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: credits, description: description || undefined }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          email: data.email,
          previousBalance: data.previousBalance,
          newBalance: data.newBalance,
        });
        showToast(`เพิ่ม ${credits} เครดิตให้ ${email} สำเร็จ`, 'success');
        setEmail('');
        setAmount('');
        setDescription('');
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Coins size={24} className="text-accent" />
        เพิ่มเครดิตผู้ใช้
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-card-border bg-card p-5">
        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">อีเมลผู้ใช้</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@gmail.com"
            className="w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">จำนวนเครดิต</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="เช่น 100"
            min="1"
            className="w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">หมายเหตุ (ไม่บังคับ)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เช่น โปรโมชั่นพิเศษ"
            className="w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !email || !amount}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-all hover:bg-accent/80 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <Coins size={16} />}
          {submitting ? 'กำลังเพิ่มเครดิต...' : 'เพิ่มเครดิต'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="animate-fade-in rounded-2xl border border-success/20 bg-success/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-success">
            <CheckCircle size={20} />
            <span className="font-semibold">เพิ่มเครดิตสำเร็จ</span>
          </div>
          <div className="space-y-1 text-sm text-foreground/60">
            <p>อีเมล: <span className="font-medium text-foreground">{result.email}</span></p>
            <p>เครดิตเดิม: <span className="font-medium text-foreground">{result.previousBalance}</span></p>
            <p>เครดิตใหม่: <span className="font-medium text-success">{result.newBalance}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
