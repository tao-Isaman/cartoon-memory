'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Plus, ChevronUp, ChevronDown, Trash2, Loader2, Palette, Eye, EyeOff, Pencil } from 'lucide-react';

interface AdminTemplate {
  id: string;
  slug: string;
  name: string;
  filename: string;
  storage_path: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminTemplatesPage() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleToggleActive = async (template: AdminTemplate) => {
    const res = await fetch(`/api/admin/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !template.is_active }),
    });
    if (res.ok) {
      setTemplates(prev =>
        prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t)
      );
      showToast(template.is_active ? 'ปิดเทมเพลตแล้ว' : 'เปิดเทมเพลตแล้ว', 'success');
    } else {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newTemplates = [...templates];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newTemplates.length) return;

    [newTemplates[index], newTemplates[swapIndex]] = [newTemplates[swapIndex], newTemplates[index]];

    const order = newTemplates.map((t, i) => ({ id: t.id, sort_order: i + 1 }));
    setTemplates(newTemplates);

    const res = await fetch('/api/admin/templates/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });

    if (!res.ok) {
      showToast('เรียงลำดับไม่สำเร็จ', 'error');
      loadTemplates();
    }
  };

  const handleDelete = async (template: AdminTemplate) => {
    if (!confirm(`ลบเทมเพลต "${template.name}"?`)) return;

    const res = await fetch(`/api/admin/templates/${template.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      showToast('ลบเทมเพลตแล้ว', 'success');
    } else {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Palette size={24} className="text-accent" />
          จัดการเทมเพลต
          <span className="text-base font-normal text-foreground/40">({templates.length})</span>
        </h1>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/80"
        >
          <Plus size={16} />
          เพิ่มเทมเพลต
        </Link>
      </div>

      <div className="space-y-2">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className={`flex items-center gap-4 rounded-xl border border-card-border bg-card p-3 transition-opacity ${
              !template.is_active ? 'opacity-50' : ''
            }`}
          >
            {/* Preview */}
            <img
              src={template.image_url || `/template/${template.filename}`}
              alt={template.name}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{template.name}</p>
              <p className="truncate text-xs text-foreground/40">{template.slug}</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {/* Reorder */}
              <button
                onClick={() => handleReorder(index, 'up')}
                disabled={index === 0}
                className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-30"
              >
                <ChevronUp size={18} />
              </button>
              <button
                onClick={() => handleReorder(index, 'down')}
                disabled={index === templates.length - 1}
                className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-30"
              >
                <ChevronDown size={18} />
              </button>

              {/* Edit */}
              <Link
                href={`/admin/templates/${template.id}/edit`}
                className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-accent/10 hover:text-accent"
                title="แก้ไข"
              >
                <Pencil size={18} />
              </Link>

              {/* Toggle active */}
              <button
                onClick={() => handleToggleActive(template)}
                className={`rounded-lg p-1.5 transition-colors ${
                  template.is_active
                    ? 'text-success hover:bg-success/10'
                    : 'text-foreground/30 hover:bg-foreground/5'
                }`}
                title={template.is_active ? 'กำลังแสดง' : 'ซ่อนอยู่'}
              >
                {template.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(template)}
                className="rounded-lg p-1.5 text-foreground/30 transition-colors hover:bg-error/10 hover:text-error"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="rounded-2xl border border-card-border bg-card p-12 text-center">
          <Palette size={48} className="mx-auto text-foreground/15" />
          <p className="mt-3 text-foreground/40">ยังไม่มีเทมเพลต</p>
        </div>
      )}
    </div>
  );
}
