import { Card, CardContent } from '@/components/ui/card'
import Image from '@/components/image'

function B2bBanner() {
  return (
    <section className="px-4 py-8 md:px-6 md:py-12 bg-[#c4a47e33]">
      <Card className="overflow-hidden border-0 shadow-md p-0">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-0 p-0">
          {/* Left: phone visual */}
          <Image
            containerClassname="aspect-5/4"
            src="https://storage.googleapis.com/cms-prod.aepsy.com/1742808233746_b2b-b2c-teaser-banner-visual-desktop.jpg"
            alt="Person on a video call using the Aepsy app"
            className="h-full w-full object-cover"
          />

          {/* Right: text content */}
          <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
            <h2 className="font-serif text-3xl leading-tight text-primary-800 md:text-4xl">
              Strengthen mental health in the workplace
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Give your employees easy access to 1:1 counseling, self-care tools, and crisis
              intervention. Aepsy helps companies integrate mental well-being into their culture –
              flexibly and securely.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default B2bBanner
