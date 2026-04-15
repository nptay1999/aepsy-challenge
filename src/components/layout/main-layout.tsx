import { Outlet } from '@tanstack/react-router'
import Navbar from './navbar'
import Footer from './footer'
import { useNavbarContext } from './navbar-context'

function MainLayout() {
  const { variant } = useNavbarContext()
  return (
    <div className="bg-primary-foreground min-h-screen">
      <Navbar variant={variant} />
      <Outlet />
      <Footer />
    </div>
  )
}

export default MainLayout
