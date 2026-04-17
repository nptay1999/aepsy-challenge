import { useState } from 'react'
import type { Provider } from '@/services/hooks/use-psychologist-search'
import { cn } from '@/lib/utils'

interface PsychologistCardProps {
  provider: Provider
}

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
  return (
    <div className="size-16 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-semibold text-lg shrink-0">
      {initials}
    </div>
  )
}

export function PsychologistCard({ provider }: PsychologistCardProps) {
  const { userInfo, userName, profile } = provider
  const { providerInfo, providerTagInfo } = profile
  const fullName = `${userName.firstName} ${userName.lastName}`
  const [imgFailed, setImgFailed] = useState(false)
  const hasTags = providerTagInfo.tags.length > 0

  return (
    <article
      className="rounded-2xl border bg-card p-5 flex flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      tabIndex={0}
      aria-label={fullName}
    >
      <div className="flex items-center gap-4">
        {userInfo.avatar && !imgFailed ? (
          <img
            src={userInfo.avatar}
            alt={`Profile photo of ${fullName}`}
            className="size-16 rounded-full object-cover shrink-0"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <AvatarFallback name={fullName} />
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-semibold text-base leading-tight truncate">{fullName}</p>
          <p className="text-sm text-muted-foreground">{providerInfo.providerTitle}</p>
          <p className="text-sm text-muted-foreground">
            {providerInfo.yearExperience} years of experience
          </p>
        </div>
      </div>
      {hasTags && (
        <div className="flex flex-wrap gap-2 pt-1 border-t">
          {providerTagInfo.tags.map((tag, i) => (
            <span
              key={i}
              className={cn(
                'text-xs px-3 py-1 rounded-full bg-peach-50 text-peach-700 border border-peach-200',
              )}
            >
              {tag.text}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
