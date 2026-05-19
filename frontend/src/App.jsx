import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useAuthStore';
import { useCoupleStore } from './store/useCoupleStore';
import { initOneSignal } from './services/onesignal';
import { dispatchNotification } from './services/notifications';
import ReceivedNotificationOverlay from './components/ReceivedNotificationOverlay';
import MilestoneCelebration from './components/MilestoneCelebration';
import NotificationPermissionFlow from './components/NotificationPermissionFlow';
import NotificationInbox from './components/NotificationInbox';
import InstallBanner from './components/InstallBanner';
import FirstMetPrompt from './components/FirstMetPrompt';
import RouteGuard from './components/RouteGuard';

const SplashPage = lazy(() => import('./pages/SplashPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PairingPage = lazy(() => import('./pages/PairingPage'));
const QRScannerPage = lazy(() => import('./pages/QRScannerPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500">
      <div className="text-4xl animate-pulse">❤️</div>
    </div>
  );
}

// Listens for service-worker quick-reply actions from background notifications
function NotificationActionListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = async (event) => {
      const { type, action } = event.data || {};
      if (type !== 'NOTIFICATION_ACTION') return;

      const partner = useCoupleStore.getState().partner;
      if (!partner?.id) {
        navigate('/home');
        return;
      }

      if (action === 'miss-back') {
        await dispatchNotification({ receiverId: partner.id, type: 'miss' });
      } else if (action === 'send-hug') {
        await dispatchNotification({ receiverId: partner.id, type: 'hug' });
      }
      navigate('/home');
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [navigate]);

  return null;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    initOneSignal();
  }, [initialize]);

  return (
    <div className="min-h-screen">
      <NotificationActionListener />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pairing" element={<RouteGuard><PairingPage /></RouteGuard>} />
            <Route path="/scan" element={<RouteGuard><QRScannerPage /></RouteGuard>} />
            <Route path="/home" element={<RouteGuard><HomePage /></RouteGuard>} />
            <Route path="/memories" element={<RouteGuard><MemoriesPage /></RouteGuard>} />
            <Route path="/stats" element={<RouteGuard><StatsPage /></RouteGuard>} />
            <Route path="/settings" element={<RouteGuard><SettingsPage /></RouteGuard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {/* Global overlays — render above all routes */}
      <ReceivedNotificationOverlay />
      <MilestoneCelebration />
      <NotificationPermissionFlow />
      <NotificationInbox />
      <InstallBanner />
      <FirstMetPrompt />
    </div>
  );
}
