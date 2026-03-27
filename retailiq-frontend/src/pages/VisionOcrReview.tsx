import { Navigate, generatePath, useParams } from 'react-router-dom';
import { routes } from '@/routes/routes';

export default function VisionOcrReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();

  if (!jobId) {
    return <Navigate to={routes.inventoryVision} replace />;
  }

  return <Navigate to={`${generatePath(routes.inventoryVisionReview, { jobId })}?tab=review`} replace />;
}
