import { NavbarProvider } from '@/components/layout/navbar-context'
import MainLayout from '@/components/layout/main-layout'
import apolloClient from '@/services/apollo-client'
import { ApolloProvider } from '@apollo/client/react'
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <ApolloProvider client={apolloClient}>
      <NavbarProvider>
        <MainLayout />
      </NavbarProvider>
    </ApolloProvider>
  ),
})
