import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useNavbarVariant } from './layout/navbar-context'

export default function NotFoundPage() {
  useNavbarVariant('primary')

  return (
    <section
      role="status"
      className="flex min-h-[calc(100dvh-15rem)] flex-col items-center justify-center gap-4 px-6 py-20 text-center"
    >
      <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
        This page seems to be lost
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link to="/">
        <Button
          className="mt-2 rounded-full bg-peach-500 px-8 text-white hover:bg-peach-600 h-12"
          size="lg"
        >
          Go to home
        </Button>
      </Link>
    </section>
  )
}
