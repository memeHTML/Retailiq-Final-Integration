import { RoleGuard } from '@/utils/guards';

export function OwnerRoute() {
  return <RoleGuard role="owner" />;
}

