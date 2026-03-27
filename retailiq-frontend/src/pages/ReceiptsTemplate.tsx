import { Navigate } from 'react-router-dom';
import { routes } from '@/routes/routes';

export default function ReceiptsTemplatePage() {
  return <Navigate to={`${routes.inventoryReceipts}?tab=template`} replace />;
}
