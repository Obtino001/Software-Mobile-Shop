import React, { useEffect } from 'react';
import { ToastProvider } from './components/ui/toast';
import { AppLayout } from './components/layout/AppLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { Smartphone } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const { fetchInitialData, setupRealtimeSubscription, dbError } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch fresh data from Supabase PostgreSQL cloud database on mount
      fetchInitialData();

      // Listen for realtime postgres_changes from other partner's device
      const unsubscribe = setupRealtimeSubscription();
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [isAuthenticated, fetchInitialData, setupRealtimeSubscription]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F8F8] text-[#141414] space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-coral-600 to-coral-400 text-white shadow-xl shadow-coral-500/20 animate-pulse">
          <Smartphone className="h-7 w-7" />
        </div>
        <div className="text-center">
          <h2 className="text-sm font-black tracking-tight">Yasir & Saad Mobile Trading</h2>
          <p className="text-[11px] text-[#999] mt-0.5">Connecting to Cloud ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
