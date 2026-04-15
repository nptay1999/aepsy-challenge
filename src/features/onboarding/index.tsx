import { useNavbarVariant } from '@/components/layout/navbar-context'

export default function Onboarding() {
  useNavbarVariant('primary')
  return (
    // 15rem is footer
    <div className="bg-primary-foreground min-h-[calc(100dvh-15rem)] pt-16 px-6">
      <main className="bg-primary-foreground px-0 lg:px-4">Onboarding</main>
    </div>
  )
}
