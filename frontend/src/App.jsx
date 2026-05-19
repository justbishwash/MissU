import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useAuthStore';
import { initOneSignal } from './services/onesignal';

// Lazy load pages
const SplashPage = lazy(() => import('./pages/SplashPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PairingPage = lazy(() => import('./pages/PairingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Loading fallback
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500">
      <div className="text-4xl animate-pulse">❤️</div>
    </div>
  );
}

export default function App() {
  const { initialize, user, loading } = useAuthStore();

  useEffect(() => {
    initialize();
    initOneSignal();
  }, [initialize]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = useAuthStore.getState().session
      ? { data: { subscription: { unsubscribe: () => {} } } }
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pairing" element={<PairingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  );
}
