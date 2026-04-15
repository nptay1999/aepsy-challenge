import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-6 pt-20 text-center">
      <img
        src="/images/aepsy-thumbnail.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-primary-600/65" />

      <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl pb-16">
        <h1 className="font-serif text-4xl leading-tight text-white md:text-5xl">
          Psychologists with time for you and your needs
        </h1>
        <p className="max-w-md text-sm text-white/80">
          Book the right therapists at the right time to find answers to key questions.
        </p>
        <Link to="/onboarding">
          <Button
            className="mt-2 rounded-full bg-peach-500 px-8 text-white hover:bg-peach-600 h-12"
            size="lg"
          >
            Start matching
          </Button>
        </Link>
      </div>
    </section>
  )
}
