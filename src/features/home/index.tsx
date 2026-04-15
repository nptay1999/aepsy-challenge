import B2bBanner from '@/features/home/b2b-banner'
import HeroSection from './hero-section'

export default function Home() {
  return (
    <main>
      <div className="relative">
        <HeroSection />
      </div>
      <B2bBanner />
    </main>
  )
}
