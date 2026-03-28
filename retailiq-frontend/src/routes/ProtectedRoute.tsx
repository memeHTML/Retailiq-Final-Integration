import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authStore } from '@/stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
