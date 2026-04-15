import { useState, type ImgHTMLAttributes } from 'react'
import { Skeleton } from './ui/skeleton'
import { cn } from '@/lib/utils'

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  containerClassname: string
}

const DEFAULT_IMAGE = '/images/img-placeholder.png'

function Image({ containerClassname, src, ...imgProps }: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={cn('relative aspect-3/4 overflow-hidden bg-beige-100', containerClassname)}>
      {!isLoaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      <img
        {...imgProps}
        src={src}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = DEFAULT_IMAGE
          setIsLoaded(true)
        }}
      />
    </div>
  )
}

export default Image
