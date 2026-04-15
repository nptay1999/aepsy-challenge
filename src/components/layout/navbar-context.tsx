/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

type NavbarVariant = 'white' | 'primary'

type NavbarContextType = {
  variant: NavbarVariant
  setVariant: (v: NavbarVariant) => void
}

const NavbarContext = createContext<NavbarContextType>({
  variant: 'white',
  setVariant: () => {},
})

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<NavbarVariant>('white')
  return <NavbarContext.Provider value={{ variant, setVariant }}>{children}</NavbarContext.Provider>
}

export function useNavbarContext() {
  return useContext(NavbarContext)
}

/** Hook for pages: set variant on mount, reset to transparent on unmount */
export function useNavbarVariant(variant: NavbarVariant) {
  const { setVariant } = useNavbarContext()
  useEffect(() => {
    setVariant(variant)
    return () => setVariant('white')
  }, [variant, setVariant])
}
