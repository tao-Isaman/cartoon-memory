'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import CartoonCreator from '@/components/CartoonCreator';
import ImageWithLoader from '@/components/ImageWithLoader';
import { CartoonGeneration } from '@/types/cartoon';
import { Image as ImageIcon, Trash2, Loader2, Sparkles } from 'lucide-react';
import { getTemplateById } from '@/lib/templates';

type Tab = 'create' | 'gallery';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [generations, setGenerations] = useState<CartoonGeneration[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadGenerations = useCallback(
    async (newOffset: number = 0, append: boolean = false) => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/cartoon/history?userId=${user.id}&limit=9&offset=${newOffset}`
        );
        const data = await res.json();
        if (append) {
          setGenerations((prev) => [...prev, ...(data.generations || [])]);
        } else {
          setGenerations(data.generations || []);
        }
        setTotal(data.total || 0);
        setOffset(newOffset);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadGenerations(0);
  }, [loadGenerations]);

  const handleGenerated = useCallback(() => {
    loadGenerations(0);
    setActiveTab('gallery');
  }, [loadGenerations]);

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรูปนี้?')) return;
    setDeleting(id);
    try {
      const res = await fetch('/api/cartoon/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: id }),
      });
      if (res.ok) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
        setTotal((prev) => prev - 1);
        showToast('ลบรูปสำเร็จ', 'success');
      } else {
        showToast('ลบไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const tabs = [
    { id: 'create' as Tab, label: 'สร้างการ์ตูน', icon: Sparkles },
    { id: 'gallery' as Tab, label: 'ผลงาน', icon: ImageIcon, count: total },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 rounded-xl border border-card-border bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground/50 hover:text-foreground/70'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'gallery' && (tab.count ?? 0) > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <CartoonCreator onGenerated={handleGenerated} />
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <section>
          {loading && generations.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : generations.length === 0 ? (
            <div className="rounded-2xl border border-card-border bg-card p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-foreground/15" />
              <p className="mt-3 font-[family-name:var(--font-handwriting)] text-foreground/40">
                เริ่มสร้างการ์ตูนแรกของคุณ!
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                สร้างเลย
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {generations.map((gen) => (
                  <div
                    key={gen.id}
                    className="group relative overflow-hidden rounded-xl border border-card-border bg-card"
                  >
                    {gen.cartoonImageUrl && (
                      <ImageWithLoader
                        src={gen.cartoonImageUrl}
                        alt="Cartoon"
                        className="aspect-square rounded-t-xl"
                      />
                    )}
                    <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="shrink-0 text-[10px] text-foreground/40 sm:text-xs">
                          {new Date(gen.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {gen.templateName && (
                          <span className="truncate rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary sm:px-2 sm:text-[10px]">
                            {getTemplateById(gen.templateName)?.name ?? gen.templateName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(gen.id)}
                        disabled={deleting === gen.id}
                        className="shrink-0 rounded-lg p-1 text-foreground/30 transition-all hover:bg-error/10 hover:text-error sm:p-1.5 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        {deleting === gen.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {generations.length < total && (
                <button
                  onClick={() => loadGenerations(offset + 9, true)}
                  disabled={loading}
                  className="mt-4 w-full rounded-xl border border-card-border bg-card py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-primary/5 disabled:opacity-50"
                >
                  {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
