/**
 * vite.config.js
 * Oracle Document sections consumed: 1, 2, 8, 12
 * Last item from Section 11 risks addressed here: API proxy alignment
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const backendUrl = env.VITE_API_URL || 'http://localhost:5000';

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
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },
    test: {
      setupFiles: ['./src/test/setup.ts'],
      fileParallelism: false,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
          execArgv: ['--max-old-space-size=8192'],
        },
      },
    },
  };
});
