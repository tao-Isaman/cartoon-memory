'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Palette, ArrowLeft, LogOut, Menu, X, Shield } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/templates', label: 'เทมเพลต', icon: Palette },
];

export default function AdminAppBar() {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-card-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl text-accent">
          <Shield size={24} />
          Admin
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground/60 hover:bg-accent/5 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground/50 transition-colors hover:bg-primary/5 hover:text-primary md:flex"
          >
            <ArrowLeft size={16} />
            กลับหน้าแอป
          </Link>
          <button
            onClick={signOut}
            className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-foreground/50 transition-colors hover:bg-error/10 hover:text-error md:flex"
          >
            <LogOut size={16} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg p-1.5 text-foreground/60 hover:bg-accent/5 md:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="animate-fade-in border-t border-card-border bg-white px-4 pb-4 pt-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-foreground/60 hover:bg-accent/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground/60 hover:bg-primary/5"
          >
            <ArrowLeft size={18} />
            กลับหน้าแอป
          </Link>
          <button
            onClick={() => { setMobileMenuOpen(false); signOut(); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-error/70 transition-colors hover:bg-error/5"
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </nav>
      )}
    </header>
  );
}
