import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/lib/session'
import App from './App.tsx'
import './index.css'

// One shared cache for all server data (recommendations, orders, log...).
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <TooltipProvider>
            <App />
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
