import { Outlet, useRouterState } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorPage from '@/components/error-page'
import Navbar from './navbar'
import Footer from './footer'
import { useNavbarContext } from './navbar-context'

function logError(error: unknown, info: React.ErrorInfo) {
  console.error('[ErrorBoundary]', error, info)
}

function MainLayout() {
  const { variant } = useNavbarContext()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <div className="bg-primary-foreground min-h-screen">
      <Navbar variant={variant} />
      <ErrorBoundary fallback={<ErrorPage />} onError={logError} resetKeys={[pathname]}>
        <Outlet />
      </ErrorBoundary>
      <Footer />
    </div>
  )
}

export default MainLayout
