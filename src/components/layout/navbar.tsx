import { Github } from '@/assets'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui/button'

type NavbarProps = { variant?: 'white' | 'primary' }

export default function Navbar({ variant = 'white' }: NavbarProps) {
  return (
    <nav className="absolute inset-x-0 lg:inset-x-4 top-0 z-10 flex items-center justify-between px-6 py-4 h-16">
      <div className="flex items-center gap-6">
        <Link to="/">
          <span
            className={cn(
              'font-serif text-2xl',
              variant === 'white' && 'text-white',
              variant === 'primary' && 'text-primary',
            )}
          >
            Aepsy
          </span>
        </Link>
      </div>

      <div
        className={cn(
          'items-center gap-4 text-sm flex',
          variant === 'white' && 'text-white/90',
          variant === 'primary' && 'text-primary/90',
        )}
      >
        <a href="https://github.com/nptay1999/aepsy-challenge" target="__blank">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'flex cursor-pointer items-center gap-1 hover:bg-transparent',
              variant === 'white' && 'hover:text-white',
              variant === 'primary' && 'hover:text-primary',
            )}
          >
            <Github
              className={cn(
                'size-5',
                variant === 'white' && 'text-white',
                variant === 'primary' && 'text-primary',
              )}
            />
          </Button>
        </a>
      </div>
    </nav>
  )
}
