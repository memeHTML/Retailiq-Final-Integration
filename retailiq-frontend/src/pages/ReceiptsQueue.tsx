import { Navigate } from 'react-router-dom';
import { routes } from '@/routes/routes';

export default function ReceiptsQueuePage() {
  return <Navigate to={`${routes.inventoryReceipts}?tab=queue`} replace />;
}
