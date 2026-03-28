import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '@/stores/authStore';

interface OwnerRouteProps {
  children?: ReactNode;
}

export function OwnerRoute({ children }: OwnerRouteProps) {
  const role = authStore((state) => state.role);

  if (role !== 'owner') {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default OwnerRoute;
