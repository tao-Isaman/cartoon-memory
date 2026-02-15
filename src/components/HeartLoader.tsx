'use client';

import { Heart } from 'lucide-react';

interface HeartLoaderProps {
  text?: string;
}

export default function HeartLoader({ text = 'กำลังสร้างการ์ตูน...' }: HeartLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <Heart
          size={48}
          className="animate-heartbeat fill-primary text-primary"
        />
        <Heart
          size={24}
          className="absolute -right-2 -top-2 animate-float fill-secondary text-secondary"
          style={{ animationDelay: '0.3s' }}
        />
        <Heart
          size={16}
          className="absolute -left-3 top-1 animate-float fill-accent text-accent"
          style={{ animationDelay: '0.6s' }}
        />
      </div>
      <div className="text-center">
        <p className="font-[family-name:var(--font-handwriting)] text-lg text-foreground/70">
          {text}
        </p>
        <p className="mt-1 text-xs text-foreground/40">อาจใช้เวลาสักครู่</p>
      </div>
    </div>
  );
}
