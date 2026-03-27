import { Navigate } from 'react-router-dom';
import { routes } from '@/routes/routes';

export default function VisionOcrUploadPage() {
  return <Navigate to={routes.inventoryVision} replace />;
}
