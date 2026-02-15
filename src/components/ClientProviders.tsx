'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { CreditBalanceProvider } from '@/contexts/CreditBalanceContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Toast from '@/components/Toast';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CreditBalanceProvider>
        <ToastProvider>
          {children}
          <Toast />
        </ToastProvider>
      </CreditBalanceProvider>
    </AuthProvider>
  );
}
