'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface CreditBalanceContextType {
  balance: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CreditBalanceContext = createContext<CreditBalanceContextType>({
  balance: 0,
  loading: true,
  refresh: async () => {},
});

export function CreditBalanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/credits/balance?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CreditBalanceContext.Provider value={{ balance, loading, refresh }}>
      {children}
    </CreditBalanceContext.Provider>
  );
}

export function useCreditBalance() {
  const context = useContext(CreditBalanceContext);
  if (!context) {
    throw new Error('useCreditBalance must be used within a CreditBalanceProvider');
  }
  return context;
}

export default CreditBalanceContext;
