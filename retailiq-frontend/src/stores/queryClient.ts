/**
 * src/stores/queryClient.ts
 * Oracle Document sections consumed: 5, 6, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { QueryClient } from '@tanstack/react-query';
import { authStore, getAuthIdentityKey } from '@/stores/authStore';

const shouldRetry = (failureCount: number, error: unknown) => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: number }).status);

    if ([401, 403, 404].includes(status)) {
      return false;
    }
  }

  return failureCount < 3;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

let authTransitionResetInstalled = false;

export const installAuthTransitionReset = () => {
  if (authTransitionResetInstalled) {
    return;
  }

  authTransitionResetInstalled = true;

  let previousIdentity = getAuthIdentityKey(authStore.getState().user);

  authStore.subscribe((state, previousState) => {
    const nextIdentity = getAuthIdentityKey(state.user);
    const prevIdentity = getAuthIdentityKey(previousState.user);

    if (prevIdentity === nextIdentity) {
      previousIdentity = nextIdentity;
      return;
    }

    if (previousIdentity !== null) {
      queryClient.clear();
    }

    previousIdentity = nextIdentity;
  });
};
