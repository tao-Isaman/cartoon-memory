'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditBalance } from '@/contexts/CreditBalanceContext';
import { useToast } from '@/contexts/ToastContext';
import { Sparkles, ShoppingCart, History, TrendingUp, TrendingDown, RotateCcw, Loader2 } from 'lucide-react';
import { CreditPackage, CreditTransaction } from '@/types/credits';

export default function CreditsPage() {
  const { user } = useAuth();
  const { balance, loading: balanceLoading, refresh } = useCreditBalance();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txOffset, setTxOffset] = useState(0);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/credits/packages')
      .then((r) => r.json())
      .then((d) => setPackages(d.packages || []))
      .finally(() => setLoadingPkgs(false));
  }, []);

  const loadTransactions = useCallback(
    async (offset: number = 0) => {
      if (!user) return;
      setLoadingTx(true);
      try {
        const res = await fetch(
          `/api/credits/transactions?userId=${user.id}&limit=10&offset=${offset}`
        );
        const data = await res.json();
        if (offset === 0) {
          setTransactions(data.transactions || []);
        } else {
          setTransactions((prev) => [...prev, ...(data.transactions || [])]);
        }
        setTxTotal(data.total || 0);
        setTxOffset(offset);
      } finally {
        setLoadingTx(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadTransactions(0);
  }, [loadTransactions]);

  const handleBuy = async (packageId: string) => {
    if (!user) return;
    setCheckoutLoading(packageId);
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('ไม่สามารถสร้างลิงก์ชำระเงินได้', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง', 'error');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const txTypeConfig = {
    purchase: { icon: TrendingUp, color: 'text-success', label: 'ซื้อเครดิต', sign: '+' },
    use: { icon: TrendingDown, color: 'text-error', label: 'ใช้เครดิต', sign: '' },
    refund: { icon: RotateCcw, color: 'text-accent', label: 'คืนเครดิต', sign: '+' },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Balance Card */}
      <div className="rounded-2xl border border-card-border bg-gradient-to-br from-primary/5 to-secondary/5 p-6 text-center">
        <p className="text-sm text-foreground/60">เครดิตของคุณ</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Sparkles className="text-secondary" size={28} />
          <span className="text-4xl font-bold text-foreground">
            {balanceLoading ? '...' : balance.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-xs text-foreground/40">1 รูปการ์ตูน = 10 เครดิต</p>
      </div>

      {/* Packages */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ShoppingCart size={20} className="text-primary" />
          ซื้อเครดิต
        </h2>
        {loadingPkgs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border bg-card p-5 transition-all hover:shadow-md ${
                  pkg.isPopular
                    ? 'border-primary shadow-sm'
                    : 'border-card-border'
                }`}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                    ยอดนิยม
                  </span>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {pkg.credits.toLocaleString()}
                  </p>
                  <p className="text-sm text-foreground/50">เครดิต</p>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-primary">
                      ฿{pkg.priceTHB}
                    </span>
                  </div>
                  {pkg.discountPercent > 0 && (
                    <span className="mt-1 inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      ประหยัด {pkg.discountPercent}%
                    </span>
                  )}
                  <button
                    onClick={() => handleBuy(pkg.id)}
                    disabled={checkoutLoading === pkg.id}
                    className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] ${
                      pkg.isPopular
                        ? 'bg-primary hover:bg-primary-dark'
                        : 'bg-foreground/80 hover:bg-foreground'
                    } disabled:opacity-50`}
                  >
                    {checkoutLoading === pkg.id ? (
                      <Loader2 className="mx-auto animate-spin" size={18} />
                    ) : (
                      'ซื้อเลย'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <History size={20} className="text-primary" />
          ประวัติการใช้เครดิต
        </h2>
        {loadingTx && transactions.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
            <History size={40} className="mx-auto text-foreground/20" />
            <p className="mt-3 text-foreground/40">ยังไม่มีประวัติการใช้เครดิต</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {transactions.map((tx) => {
                const config = txTypeConfig[tx.type as keyof typeof txTypeConfig] || txTypeConfig.use;
                const Icon = config.icon;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full bg-card p-2 ${config.color}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {tx.description || config.label}
                        </p>
                        <p className="text-xs text-foreground/40">
                          {new Date(tx.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${config.color}`}>
                        {config.sign}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-foreground/40">
                        คงเหลือ {tx.balanceAfter.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {transactions.length < txTotal && (
              <button
                onClick={() => loadTransactions(txOffset + 10)}
                disabled={loadingTx}
                className="mt-4 w-full rounded-xl border border-card-border bg-card py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-primary/5 disabled:opacity-50"
              >
                {loadingTx ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
