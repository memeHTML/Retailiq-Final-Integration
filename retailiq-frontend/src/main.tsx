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
import { queryClient } from '@/stores/queryClient';
import { ToastProvider } from '@/components/ui/ToastProvider';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} fallbackElement={<div className="app-content">Loading…</div>} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
