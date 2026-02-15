'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import CartoonCreator from '@/components/CartoonCreator';
import ImageWithLoader from '@/components/ImageWithLoader';
import { CartoonGeneration } from '@/types/cartoon';
import { Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { getTemplateById } from '@/lib/templates';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
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

  return (
    <div className="space-y-8">
      {/* Cartoon Creator */}
      <CartoonCreator onGenerated={() => loadGenerations(0)} />

      {/* Gallery */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ImageIcon size={20} className="text-primary" />
          ผลงานของคุณ
          {total > 0 && (
            <span className="text-sm font-normal text-foreground/40">
              ({total} รูป)
            </span>
          )}
        </h2>

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
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/40">
                        {new Date(gen.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {gen.templateName && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {getTemplateById(gen.templateName)?.name ?? gen.templateName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(gen.id)}
                      disabled={deleting === gen.id}
                      className="rounded-lg p-1.5 text-foreground/30 opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100"
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
    </div>
  );
}
