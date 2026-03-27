/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { authStore } from './authStore';
import { installAuthTransitionReset, queryClient } from './queryClient';

const ownerOne = {
  user_id: 1,
  mobile_number: '9999999999',
  full_name: 'Owner One',
  email: 'owner1@example.com',
  role: 'owner' as const,
  store_id: 10,
};

const ownerTwo = {
  user_id: 2,
  mobile_number: '8888888888',
  full_name: 'Owner Two',
  email: 'owner2@example.com',
  role: 'owner' as const,
  store_id: 20,
};

describe('auth transition cache reset', () => {
  beforeEach(() => {
    queryClient.clear();
    authStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      role: null,
    });
  });

  it('clears the query cache on logout transitions', () => {
    authStore.setState({
      user: ownerOne,
      isAuthenticated: true,
      role: ownerOne.role,
    });
    installAuthTransitionReset();

    const key = ['inventory', 'list', { page: 1, page_size: 25 }];
    queryClient.setQueryData(key, { cached: true });

    authStore.setState({
      user: null,
      isAuthenticated: false,
      role: null,
    });

    expect(queryClient.getQueryData(key)).toBeUndefined();
  });

  it('clears the query cache when the active store changes', () => {
    authStore.setState({
      user: ownerOne,
      isAuthenticated: true,
      role: ownerOne.role,
    });
    installAuthTransitionReset();

    const key = ['receipts', 'template'];
    queryClient.setQueryData(key, { cached: true });

    authStore.setState({
      user: ownerTwo,
      isAuthenticated: true,
      role: ownerTwo.role,
    });

    expect(queryClient.getQueryData(key)).toBeUndefined();
  });
});
