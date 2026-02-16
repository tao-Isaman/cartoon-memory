'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { Upload, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AdminTemplate {
  id: string;
  slug: string;
  name: string;
  filename: string;
  storage_path: string;
  image_url: string;
  prompt: string;
  is_active: boolean;
  sort_order: number;
}

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [template, setTemplate] = useState<AdminTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(res => res.json())
      .then(data => {
        const found = (data.templates ?? []).find((t: AdminTemplate) => t.id === id);
        if (found) {
          setTemplate(found);
          setName(found.name);
          setSlug(found.slug);
          setPrompt(found.prompt ?? '');
          setPreview(found.image_url || `/template/${found.filename}`);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !name || !slug) {
      showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = template.image_url;
      let storagePath = template.storage_path;
      let filename = template.filename;

      // Upload new image if changed
      if (file) {
        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('slug', slug);

        const uploadRes = await fetch('/api/admin/templates/upload', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          showToast(uploadData.error || 'อัพโหลดไม่สำเร็จ', 'error');
          return;
        }

        imageUrl = uploadData.imageUrl;
        storagePath = uploadData.storagePath;
        filename = uploadData.filename;
      }

      // Update template record
      const updateRes = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          prompt,
          filename,
          storage_path: storagePath,
          image_url: imageUrl,
        }),
      });
      const updateData = await updateRes.json();

      if (updateRes.ok) {
        showToast('แก้ไขเทมเพลตสำเร็จ', 'success');
        router.push('/admin/templates');
      } else {
        showToast(updateData.error || 'แก้ไขไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p className="text-foreground/50">ไม่พบเทมเพลต</p>
        <Link href="/admin/templates" className="text-sm text-accent hover:underline">
          กลับไปหน้ารายการ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/templates"
          className="rounded-lg p-2 text-foreground/50 transition-colors hover:bg-accent/5 hover:text-accent"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">แก้ไขเทมเพลต</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-card-border bg-card p-5">
        {/* Image */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">รูปเทมเพลต</label>
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="aspect-square w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(template.image_url || `/template/${template.filename}`); }}
                className="absolute right-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
              >
                {file ? 'ยกเลิก' : 'เปลี่ยน'}
              </button>
              {!file && (
                <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70">
                  เปลี่ยนรูป
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-card-border py-12 transition-colors hover:border-accent/50 hover:bg-accent/5">
              <Upload size={28} className="text-accent" />
              <span className="text-sm text-foreground/50">คลิกเพื่อเลือกรูป</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">ชื่อเทมเพลต</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น โทนชมพู"
            className="w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">Slug (ภาษาอังกฤษ)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}
            placeholder="เช่น pink_tone"
            className="w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/60">Prompt (สำหรับ AI)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="apply style and background of first image into second image"
            className="w-full rounded-xl border border-card-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <p className="mt-1 text-xs text-foreground/30">Prompt ที่ใช้ส่งให้ AI สร้างรูปการ์ตูน</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !name || !slug}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-all hover:bg-accent/80 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
        </button>
      </form>
    </div>
  );
}
