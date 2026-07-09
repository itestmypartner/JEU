import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { App } from './App.js';
import { AuthProvider } from './context/AuthContext.js';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Conserve les données précédentes pendant un changement de filtre/page :
      // les listes ne « clignotent » plus vers un écran de chargement.
      placeholderData: keepPreviousData,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#131f1b',
              color: '#e2e8f0',
              border: '1px solid #24382f',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
