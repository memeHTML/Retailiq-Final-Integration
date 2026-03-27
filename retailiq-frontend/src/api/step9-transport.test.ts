import http from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type ImportedClient = typeof import('@/api/client');
type ImportedStore = typeof import('@/stores/authStore');

describe('Prompt 00 step 9 transport verification', () => {
  let server: http.Server;
  let baseUrl = '';
  let apiClientModule: ImportedClient;
  let authStoreModule: ImportedStore;

  beforeAll(async () => {
    server = http.createServer(async (req, res) => {
      const url = req.url ?? '';
      const method = req.method ?? 'GET';
      const authHeader = req.headers.authorization ?? '';
      const chunks: Buffer[] = [];

      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      await new Promise<void>((resolve) => req.on('end', resolve));
      const bodyText = Buffer.concat(chunks).toString('utf8');
      const body = bodyText ? JSON.parse(bodyText) : null;

      const sendJson = (status: number, payload: unknown) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      };

      if (url === '/api/v1/auth/refresh' && method === 'POST') {
        if (body?.refresh_token === 'fresh-refresh-token') {
          sendJson(200, {
            success: true,
            data: {
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              user_id: 1,
              role: 'owner',
              store_id: 99,
            },
            error: null,
            meta: null,
          });
          return;
        }

        sendJson(401, { success: false, error: 'refresh failed', data: null, meta: null });
        return;
      }

      if (url === '/api/v1/protected' && method === 'GET') {
        if (authHeader === 'Bearer new-access-token') {
          sendJson(200, { success: true, data: { ok: true }, error: null, meta: null });
          return;
        }

        sendJson(401, { success: false, error: 'expired', data: null, meta: null });
        return;
      }

      if (url === '/api/v1/inventory/10/stock' && method === 'POST') {
        sendJson(404, { success: false, error: 'not found', data: null, meta: null });
        return;
      }

      if (url === '/api/v1/inventory/10/stock-update' && method === 'POST') {
        sendJson(200, {
          success: true,
          data: {
            product_id: 10,
            current_stock: 42,
            applied: body,
          },
          error: null,
          meta: null,
        });
        return;
      }

      if (url === '/api/v1/inventory/audit' && method === 'POST') {
        sendJson(404, { success: false, error: 'not found', data: null, meta: null });
        return;
      }

      if (url === '/api/v1/inventory/stock-audit' && method === 'POST') {
        sendJson(201, {
          success: true,
          data: {
            items: [
              { product_id: 10, counted_quantity: 40, difference: -2 },
            ],
          },
          error: null,
          meta: null,
        });
        return;
      }

      sendJson(404, { success: false, error: `Unhandled route: ${method} ${url}`, data: null, meta: null });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Unable to determine test server port.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
    vi.stubEnv('VITE_API_URL', baseUrl);
    vi.resetModules();

    authStoreModule = await import('@/stores/authStore');
    apiClientModule = await import('@/api/client');
  });

  beforeEach(() => {
    authStoreModule.authStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      role: null,
    });
    authStoreModule.authStore.getState().clearAuth();
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    vi.unstubAllEnvs();
  });

  it('refreshes an expired token once and retries the original request', async () => {
    authStoreModule.authStore.getState().setTokens('expired-access-token', 'fresh-refresh-token');
    authStoreModule.authStore.getState().setUser({
      user_id: 1,
      role: 'owner',
      store_id: 99,
      mobile_number: '9999999999',
      full_name: 'Owner User',
    });

    const result = await apiClientModule.apiGet<{ ok: boolean }>('/api/v1/protected');

    expect(result).toEqual({ ok: true });
    expect(authStoreModule.authStore.getState().accessToken).toBe('new-access-token');
    expect(authStoreModule.authStore.getState().refreshToken).toBe('new-refresh-token');
  });

  it('clears auth if refresh fails', async () => {
    authStoreModule.authStore.getState().setTokens('expired-access-token', 'bad-refresh-token');
    authStoreModule.authStore.getState().setUser({
      user_id: 1,
      role: 'owner',
      store_id: 99,
      mobile_number: '9999999999',
      full_name: 'Owner User',
    });

    await expect(apiClientModule.apiGet('/api/v1/protected')).rejects.toBeTruthy();

    expect(authStoreModule.authStore.getState().accessToken).toBeNull();
    expect(authStoreModule.authStore.getState().refreshToken).toBeNull();
    expect(authStoreModule.authStore.getState().isAuthenticated).toBe(false);
  });

  it('falls back from the primary inventory endpoints to the alias endpoints', async () => {
    authStoreModule.authStore.getState().setTokens('expired-access-token', 'fresh-refresh-token');
    authStoreModule.authStore.getState().setUser({
      user_id: 1,
      role: 'owner',
      store_id: 99,
      mobile_number: '9999999999',
      full_name: 'Owner User',
    });

    const stockResult = await apiClientModule.requestWithFallback<{
      product_id: number;
      current_stock: number;
      applied: { quantity_change: number };
    }>(
      '/api/v1/inventory/10/stock',
      '/api/v1/inventory/10/stock-update',
      'POST',
      { quantity_change: 5 },
    );

    expect(stockResult).toEqual({
      product_id: 10,
      current_stock: 42,
      applied: { quantity_change: 5 },
    });

    const auditResult = await apiClientModule.requestWithFallback<{
      items: Array<{ product_id: number; counted_quantity: number; difference: number }>;
    }>(
      '/api/v1/inventory/audit',
      '/api/v1/inventory/stock-audit',
      'POST',
      {
        items: [{ product_id: 10, counted_quantity: 40, notes: 'Counted at close' }],
      },
    );

    expect(auditResult.items).toHaveLength(1);
    expect(auditResult.items[0]).toEqual({ product_id: 10, counted_quantity: 40, difference: -2 });
  });
});
