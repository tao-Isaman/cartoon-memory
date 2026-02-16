'use client';

import { useState, useEffect } from 'react';
import { Users, Image, Zap, Loader2, BarChart3 } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalGenerations: number;
  totalCreditsUsed: number;
  templateUsage: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'รูปที่สร้าง', value: stats.totalGenerations, icon: Image, color: 'text-accent' },
    { label: 'เครดิตที่ใช้', value: stats.totalCreditsUsed, icon: Zap, color: 'text-secondary' },
  ];

  const sortedTemplateUsage = Object.entries(stats.templateUsage)
    .sort(([, a], [, b]) => b - a);

  const maxUsage = sortedTemplateUsage.length > 0 ? sortedTemplateUsage[0][1] : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแล</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-card-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl bg-card p-2.5 ${card.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-sm text-foreground/50">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Usage */}
      <div className="rounded-2xl border border-card-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BarChart3 size={20} className="text-accent" />
          การใช้งานเทมเพลต
        </h2>
        {sortedTemplateUsage.length === 0 ? (
          <p className="text-sm text-foreground/40">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {sortedTemplateUsage.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-foreground/70">{name}</span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-accent/10">
                    <div
                      className="flex h-full items-center rounded-full bg-accent/20 px-2 text-xs font-medium text-accent transition-all"
                      style={{ width: `${Math.max((count / maxUsage) * 100, 8)}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
