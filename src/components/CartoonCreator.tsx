'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance } from '@/contexts/CreditBalanceContext';
import { useToast } from '@/contexts/ToastContext';
import { processImage } from '@/lib/upload';
import { CARTOON_CREDIT_COST, MAX_FILE_SIZE } from '@/lib/constants';
import { TEMPLATES, DEFAULT_TEMPLATE, Template } from '@/lib/templates';
import HeartLoader from './HeartLoader';
import { Upload, ImagePlus, Download, RotateCcw, AlertCircle, Check, Camera } from 'lucide-react';
import { CartoonGeneration } from '@/types/cartoon';

type CreatorState = 'select' | 'upload' | 'preview' | 'generating' | 'result';

interface CartoonCreatorProps {
  onGenerated?: () => void;
}

export default function CartoonCreator({ onGenerated }: CartoonCreatorProps) {
  const { user } = useAuth();
  const { balance, refresh } = useCreditBalance();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<CreatorState>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CartoonGeneration | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(DEFAULT_TEMPLATE);

  const handleTemplateSelect = (t: Template) => {
    setSelectedTemplate(t);
    setState('upload');
  };

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast('ไฟล์ต้องมีขนาดไม่เกิน 10MB', 'error');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('รองรับเฉพาะไฟล์ JPG, PNG, WebP', 'error');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState('preview');
  }, [showToast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleGenerate = async () => {
    if (!user || !selectedFile) return;

    if (balance < CARTOON_CREDIT_COST) {
      showToast(`เครดิตไม่เพียงพอ (ต้องการ ${CARTOON_CREDIT_COST} เครดิต)`, 'error');
      return;
    }

    setState('generating');

    try {
      const processed = await processImage(selectedFile);
      const formData = new FormData();
      formData.append('file', processed, 'photo.webp');
      formData.append('templateId', selectedTemplate.id);

      const res = await fetch('/api/cartoon/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.generation);
        setState('result');
        await refresh();
        onGenerated?.();
        showToast('สร้างการ์ตูนสำเร็จ!', 'success');
      } else {
        setState('preview');
        if (data.error === 'insufficient_credits') {
          showToast('เครดิตไม่เพียงพอ', 'error');
        } else {
          showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
        }
        if (data.refunded) {
          showToast('เครดิตถูกคืนแล้ว', 'info');
        }
        await refresh();
      }
    } catch {
      setState('preview');
      showToast('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง', 'error');
    }
  };

  const handleReset = () => {
    setState('select');
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setSelectedTemplate(DEFAULT_TEMPLATE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async () => {
    if (!result?.cartoonImageUrl) return;
    try {
      const res = await fetch(result.cartoonImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartoon-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('ดาวน์โหลดไม่สำเร็จ', 'error');
    }
  };

  return (
    <div>
      {/* Template Feed — Instagram feed style (single column scroll) */}
      {state === 'select' && (
        <div className="space-y-4">
          <p className="text-sm text-foreground/50">
            เลือกสไตล์ที่ชอบ
            <span className="ml-2 text-xs text-foreground/30">
              ({CARTOON_CREDIT_COST} เครดิต/รูป)
            </span>
          </p>
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="overflow-hidden rounded-xl border border-card-border bg-card"
            >
              {/* Post header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <img
                  src={t.path}
                  alt={t.name}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                />
                <span className="text-sm font-semibold">{t.name}</span>
              </div>
              {/* Post image */}
              <img
                src={t.path}
                alt={t.name}
                className="aspect-square w-full object-cover"
              />
              {/* Post action */}
              <div className="px-4 py-3">
                <button
                  onClick={() => handleTemplateSelect(t)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
                >
                  <Camera size={16} />
                  ใช้สไตล์นี้
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload State — with selected template header */}
      {state === 'upload' && (
        <div className="space-y-4">
          {/* Selected template bar */}
          <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3">
            <img
              src={selectedTemplate.path}
              alt={selectedTemplate.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedTemplate.name}</p>
              <p className="text-xs text-foreground/40">สไตล์ที่เลือก</p>
            </div>
            <button
              onClick={() => setState('select')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
            >
              เปลี่ยน
            </button>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-card-border py-12 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <Upload size={28} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">อัพโหลดรูปภาพ</p>
              <p className="mt-1 text-xs text-foreground/40">
                ลากไฟล์มาวาง หรือคลิกเพื่อเลือก (JPG, PNG, WebP ไม่เกิน 10MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && previewUrl && (
        <div className="space-y-4">
          {/* Selected template bar */}
          <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3">
            <img
              src={selectedTemplate.path}
              alt={selectedTemplate.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedTemplate.name}</p>
              <p className="text-xs text-foreground/40">สไตล์ที่เลือก</p>
            </div>
            <Check size={16} className="text-primary" />
          </div>

          <div className="relative mx-auto max-w-xs overflow-hidden rounded-xl">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-xl"
            />
          </div>
          {balance < CARTOON_CREDIT_COST && (
            <div className="flex items-center gap-2 rounded-lg bg-error/5 px-3 py-2 text-sm text-error">
              <AlertCircle size={16} />
              เครดิตไม่เพียงพอ (มี {balance} ต้องการ {CARTOON_CREDIT_COST})
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl border border-card-border py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-primary/5"
            >
              เปลี่ยนรูป
            </button>
            <button
              onClick={handleGenerate}
              disabled={balance < CARTOON_CREDIT_COST}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
            >
              <ImagePlus size={16} />
              สร้างการ์ตูน
            </button>
          </div>
        </div>
      )}

      {/* Generating State */}
      {state === 'generating' && <HeartLoader />}

      {/* Result State */}
      {state === 'result' && result && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {previewUrl && (
              <div>
                <p className="mb-1 text-center text-xs text-foreground/40">ต้นฉบับ</p>
                <img
                  src={previewUrl}
                  alt="Original"
                  className="w-full rounded-xl"
                />
              </div>
            )}
            {result.cartoonImageUrl && (
              <div>
                <p className="mb-1 text-center text-xs text-foreground/40">การ์ตูน</p>
                <img
                  src={result.cartoonImageUrl}
                  alt="Cartoon"
                  className="w-full rounded-xl"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-primary/5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Download size={16} />
              ดาวน์โหลด
            </button>
            <button
              onClick={handleReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <RotateCcw size={16} />
              สร้างรูปใหม่
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
