import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Auth guard. Redirects to /login if the user isn't signed in once auth has
 * finished loading. Renders nothing while loading so we don't flash protected
 * UI to anonymous visitors.
 *
 * Use it like:
 *   <RouteGuard><HomePage /></RouteGuard>
 */
export default function RouteGuard({ children }) {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500">
        <div className="text-4xl animate-pulse">❤️</div>
      </div>
    );
  }

  return children;
}
