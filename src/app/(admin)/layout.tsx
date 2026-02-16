'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminAppBar from '@/components/AdminAppBar';
import { Shield } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    fetch('/api/admin/me')
      .then(res => res.json())
      .then(data => {
        if (!data.isAdmin) {
          router.replace('/dashboard');
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => router.replace('/dashboard'));
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-heartbeat text-accent">
          <Shield size={48} />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <AdminAppBar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
