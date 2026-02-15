'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import CartoonCreator from '@/components/CartoonCreator';
import ImageWithLoader from '@/components/ImageWithLoader';
import { CartoonGeneration } from '@/types/cartoon';
import { Image as ImageIcon, Trash2, Loader2, Sparkles, X, Download } from 'lucide-react';
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
  const [viewingImage, setViewingImage] = useState<CartoonGeneration | null>(null);

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

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `cartoon-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('ดาวน์โหลดไม่สำเร็จ', 'error');
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

      {/* Gallery Tab — Instagram profile grid */}
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
              <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl">
                {generations.map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => gen.cartoonImageUrl && setViewingImage(gen)}
                    className="group relative aspect-square overflow-hidden bg-card focus:outline-none"
                  >
                    {gen.cartoonImageUrl && (
                      <ImageWithLoader
                        src={gen.cartoonImageUrl}
                        alt="Cartoon"
                        className="h-full w-full"
                      />
                    )}
                    {/* Hover overlay on desktop */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <ImageIcon
                        size={24}
                        className="text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-80"
                      />
                    </div>
                  </button>
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

      {/* Lightbox Modal */}
      {viewingImage && viewingImage.cartoonImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 rounded-full p-1.5 text-white/70 transition-colors hover:text-white"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <img
              src={viewingImage.cartoonImageUrl}
              alt="Cartoon"
              className="w-full rounded-xl"
            />

            {/* Info bar */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">
                  {new Date(viewingImage.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {viewingImage.templateName && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                    {getTemplateById(viewingImage.templateName)?.name ?? viewingImage.templateName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(viewingImage.cartoonImageUrl!)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
                >
                  <Download size={14} />
                  บันทึก
                </button>
                <button
                  onClick={() => {
                    handleDelete(viewingImage.id);
                    setViewingImage(null);
                  }}
                  disabled={deleting === viewingImage.id}
                  className="flex items-center gap-1.5 rounded-lg bg-error/20 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/30"
                >
                  <Trash2 size={14} />
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
