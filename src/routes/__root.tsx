import { NavbarProvider } from '@/components/layout/navbar-context'
import MainLayout from '@/components/layout/main-layout'
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <NavbarProvider>
      <MainLayout />
    </NavbarProvider>
  ),
})
