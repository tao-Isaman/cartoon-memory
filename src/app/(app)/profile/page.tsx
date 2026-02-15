'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance } from '@/contexts/CreditBalanceContext';
import { useToast } from '@/contexts/ToastContext';
import { User, CheckCircle, Sparkles, Loader2, Save } from 'lucide-react';

interface ProfileData {
  phone: string;
  birthday: string;
  gender: string;
  job: string;
  relationshipStatus: string;
  occasionType: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { refresh } = useCreditBalance();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [creditsClaimed, setCreditsClaimed] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    phone: '',
    birthday: '',
    gender: '',
    job: '',
    relationshipStatus: '',
    occasionType: '',
  });

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setForm({
            phone: data.profile.phone || '',
            birthday: data.profile.birthday || '',
            gender: data.profile.gender || '',
            job: data.profile.job || '',
            relationshipStatus: data.profile.relationshipStatus || '',
            occasionType: data.profile.occasionType || '',
          });
          setCreditsClaimed(data.profile.profileCreditsClaimed);
        }
        setIsComplete(data.isComplete);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const isFormComplete = Object.values(form).every((v) => v.trim() !== '');

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...form }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsComplete(data.isComplete);
        showToast('บันทึกโปรไฟล์สำเร็จ', 'success');

        // Auto-claim credits if profile just became complete
        if (data.isComplete && !creditsClaimed) {
          const claimRes = await fetch('/api/profile/claim-credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
          const claimData = await claimRes.json();
          if (claimData.success && !claimData.alreadyClaimed) {
            showToast('ได้รับ 10 เครดิตฟรี!', 'success');
            setCreditsClaimed(true);
          }
          await refresh();
        }
      } else {
        showToast('บันทึกไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            className="h-16 w-16 rounded-full border-2 border-card-border"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User size={28} className="text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{user?.user_metadata?.full_name || 'โปรไฟล์'}</h1>
          <p className="text-sm text-foreground/50">{user?.email}</p>
          {isComplete && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <CheckCircle size={12} /> โปรไฟล์ครบ
            </span>
          )}
        </div>
      </div>

      {/* Credit Reward Banner */}
      {!isComplete && !creditsClaimed && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3">
          <Sparkles className="shrink-0 text-secondary" size={20} />
          <p className="text-sm">
            กรอกข้อมูลครบ รับ{' '}
            <span className="font-semibold text-primary">10 เครดิตฟรี!</span>
          </p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
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

        <div>
          <label className="mb-1 block text-sm font-medium">วันเกิด</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className={inputClass}
          />
        </div>

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

        <div>
          <label className="mb-1 block text-sm font-medium">อาชีพ</label>
          <input
            type="text"
            value={form.job}
            onChange={(e) => setForm({ ...form, job: e.target.value })}
            placeholder="เช่น นักเรียน, วิศวกร"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">สถานะความสัมพันธ์</label>
          <select
            value={form.relationshipStatus}
            onChange={(e) => setForm({ ...form, relationshipStatus: e.target.value })}
            className={inputClass}
          >
            <option value="">เลือก</option>
            <option value="single">โสด</option>
            <option value="dating">มีแฟน</option>
            <option value="married">แต่งงาน</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">โอกาสพิเศษ</label>
          <select
            value={form.occasionType}
            onChange={(e) => setForm({ ...form, occasionType: e.target.value })}
            className={inputClass}
          >
            <option value="">เลือก</option>
            <option value="valentine">วาเลนไทน์</option>
            <option value="anniversary">วันครบรอบ</option>
            <option value="birthday">วันเกิด</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Save size={16} />
              บันทึก
            </>
          )}
        </button>
      </div>
    </div>
  );
}
