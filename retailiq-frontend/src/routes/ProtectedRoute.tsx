import { AuthGuard } from '@/utils/guards';

export function ProtectedRoute() {
  return <AuthGuard />;
}

