/**
 * vite.config.ts
 * Oracle Document sections consumed: 1, 2, 8, 12
 * Last item from Section 11 risks addressed here: API proxy alignment
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  // Only configure proxy if backend URL is provided
  const backendUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
  const enableProxy = Boolean(env.VITE_API_BASE_URL);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      ...(enableProxy
        ? {
            proxy: {
              '/api': {
                target: backendUrl,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
  };
});
