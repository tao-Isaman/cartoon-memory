'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance } from '@/contexts/CreditBalanceContext';
import { Wand2, Coins, User, LogOut, Menu, X, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: Wand2 },
  { href: '/credits', label: 'ซื้อเครดิต', icon: Coins },
  { href: '/profile', label: 'โปรไฟล์', icon: User },
];

export default function AppBar() {
  const { user, signOut } = useAuth();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="sticky top-0 z-40 border-b border-card-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-2xl text-primary">
          Cartoon Gen
        </Link>

        {/* Desktop Nav */}
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
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-primary/5 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Credit Balance */}
          <Link
            href="/credits"
            className="flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/30"
          >
            <Sparkles size={16} className="text-secondary" />
            {balanceLoading ? '...' : balance}
          </Link>

          {/* User Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-8 w-8 rounded-full border-2 border-card-border"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User size={16} className="text-primary" />
            </div>
          )}

          {/* Sign Out (desktop) */}
          <button
            onClick={signOut}
            className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-foreground/50 transition-colors hover:bg-error/10 hover:text-error md:flex"
            title="ออกจากระบบ"
          >
            <LogOut size={16} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg p-1.5 text-foreground/60 hover:bg-primary/5 md:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
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
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-primary/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
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
