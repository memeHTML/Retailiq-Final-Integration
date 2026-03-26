/**
 * src/main.tsx
 * Oracle Document sections consumed: 6, 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { queryClient } from '@/stores/queryClient';
import { ToastProvider } from '@/components/ui/ToastProvider';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary fallback={<div className="app-content" role="alert">Something went wrong.</div>}>
          <RouterProvider router={router} fallbackElement={<div className="app-content">Loading…</div>} />
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
