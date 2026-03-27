import { useQuery } from '@tanstack/react-query';
import * as offlineApi from '@/api/offline';

export const useOfflineSnapshotQuery = () =>
  useQuery({
    queryKey: ['offline', 'snapshot'],
    queryFn: () => offlineApi.getSnapshot(),
    staleTime: 300_000,
    refetchInterval: (query) => (query.state.data && 'status' in query.state.data && query.state.data.status === 'building' ? 10_000 : false),
  });
