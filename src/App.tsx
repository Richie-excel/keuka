import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/features/identity/auth-context'
import { router } from '@/routes/router'
import { queryClient } from './lib/query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppErrorBoundary } from '@/shared/errors/app-error-boundary'
import { Toaster } from '@/components/ui/sonner'
import { PrintProvider } from '@/components/documents/print-provider'

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PrintProvider>
            <RouterProvider router={router} />
          </PrintProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default App
