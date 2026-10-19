import { Outlet } from 'react-router-dom'
import { AppShell } from '@/shared/layout/app-shell'
import { ProtectedRoute } from '@/routes/protected-route'
import { SidebarProvider } from '@/components/ui/sidebar'

export function DashboardLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
