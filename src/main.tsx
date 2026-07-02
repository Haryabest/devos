import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { router } from '@/app/router';
import { queryClient } from '@/lib/query-client';
import { initCollaborationSync } from '@/lib/sync-engine';
import '@/lib/workspace-init';
import '@/styles/globals.css';
import 'react-day-picker/style.css';

initCollaborationSync();

const root = document.getElementById('root');
if (!root) throw new Error('#root not found in index.html');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
