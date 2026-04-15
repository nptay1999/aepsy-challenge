import { cn } from '@/lib/utils'
import { AlignRight, Globe } from 'lucide-react'

type NavbarProps = { variant?: 'white' | 'primary' }

export default function Navbar({ variant = 'white' }: NavbarProps) {
  return (
    <nav className="absolute inset-x-0 lg:inset-x-4 top-0 z-10 flex items-center justify-between px-6 py-4 h-16">
      <div className="flex items-center gap-6">
        <span
          className={cn(
            'font-serif text-2xl',
            variant === 'white' && 'text-white',
            variant === 'primary' && 'text-primary',
          )}
        >
          Aepsy
        </span>
      </div>

      <div
        className={cn(
          'hidden items-center gap-4 text-sm md:flex',
          variant === 'white' && 'text-white/90',
          variant === 'primary' && 'text-primary/90',
        )}
      >
        <span
          className={cn(
            'flex cursor-pointer items-center gap-1 hover:text-white',
            variant === 'white' && 'hover:text-white',
            variant === 'primary' && 'hover:text-primary',
          )}
        >
          <Globe className="size-3.5" /> EN
        </span>
      </div>

      <AlignRight
        className={cn(
          'size-6 cursor-pointer text-white md:hidden',
          variant === 'white' && 'text-white',
          variant === 'primary' && 'text-primary',
        )}
      />
    </nav>
  )
}
