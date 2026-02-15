'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance } from '@/contexts/CreditBalanceContext';
import { useToast } from '@/contexts/ToastContext';
import { Sparkles, Gift, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useAuth();
  const { refresh } = useCreditBalance();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    birthday: '',
    gender: '',
    job: '',
    relationshipStatus: '',
    occasionType: '',
  });

  const isFormComplete = Object.values(form).every((v) => v.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormComplete) return;

    setLoading(true);
    try {
      // Save profile
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...form }),
      });

      if (!profileRes.ok) {
        showToast('บันทึกโปรไฟล์ไม่สำเร็จ', 'error');
        return;
      }

      // Claim free credits
      const claimRes = await fetch('/api/profile/claim-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const claimData = await claimRes.json();

      if (claimData.success && !claimData.alreadyClaimed) {
        showToast('ได้รับ 10 เครดิตฟรี!', 'success');
      }

      await refresh();
      router.push('/dashboard');
    } catch {
      showToast('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';
  const selectClass = inputClass + ' appearance-none';

  return (
    <div className="mx-auto max-w-lg px-4 py-8 animate-slide-up">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3">
          <Gift size={36} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">ยินดีต้อนรับ!</h1>
        <p className="mt-1 text-sm text-foreground/60">
          กรอกข้อมูลเพื่อรับ{' '}
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <Sparkles size={14} /> 10 เครดิตฟรี
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium">เบอร์โทรศัพท์</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0812345678"
            className={inputClass}
          />
        </div>

        {/* Birthday */}
        <div>
          <label className="mb-1 block text-sm font-medium">วันเกิด</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="mb-1 block text-sm font-medium">เพศ</label>
          <div className="flex gap-3">
            {[
              { value: 'male', label: 'ชาย' },
              { value: 'female', label: 'หญิง' },
              { value: 'other', label: 'อื่นๆ' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, gender: opt.value })}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                  form.gender === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-card-border text-foreground/60 hover:border-primary/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job */}
        <div>
          <label className="mb-1 block text-sm font-medium">อาชีพ</label>
          <input
            type="text"
            value={form.job}
            onChange={(e) => setForm({ ...form, job: e.target.value })}
            placeholder="เช่น นักเรียน, วิศวกร, ฟรีแลนซ์"
            className={inputClass}
          />
        </div>

        {/* Relationship Status */}
        <div>
          <label className="mb-1 block text-sm font-medium">สถานะความสัมพันธ์</label>
          <select
            value={form.relationshipStatus}
            onChange={(e) => setForm({ ...form, relationshipStatus: e.target.value })}
            className={selectClass}
          >
            <option value="">เลือก</option>
            <option value="single">โสด</option>
            <option value="dating">มีแฟน</option>
            <option value="married">แต่งงาน</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        {/* Occasion Type */}
        <div>
          <label className="mb-1 block text-sm font-medium">โอกาสพิเศษ</label>
          <select
            value={form.occasionType}
            onChange={(e) => setForm({ ...form, occasionType: e.target.value })}
            className={selectClass}
          >
            <option value="">เลือก</option>
            <option value="valentine">วาเลนไทน์</option>
            <option value="anniversary">วันครบรอบ</option>
            <option value="birthday">วันเกิด</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormComplete || loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="mx-auto animate-spin" size={20} />
          ) : (
            'เริ่มใช้งาน'
          )}
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-full py-2 text-sm text-foreground/40 transition-colors hover:text-foreground/60"
        >
          ข้ามไปก่อน
        </button>
      </form>
    </div>
  );
}
