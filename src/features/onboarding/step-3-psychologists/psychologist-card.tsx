import type { Provider, ProviderTag } from '@/services/hooks/use-psychologist-search'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { capitalize } from 'es-toolkit/string'
import { ListChecks, MoonStar, UsersRound, type LucideProps } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type TLucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>

const DEFAULT_PROVIDER_TITLE = 'Psychotherapist'
const DEFAULT_TAG_ICON = ListChecks
const DEFAULT_TAG: ProviderTag = {
  type: 'FLEXIBLE_OFFERING',
  text: 'Flexible offerings',
  subType: '',
}
const tagsIcon: Record<string, TLucideIcon> = {
  FLEXIBLE_OFFERING: ListChecks,
  EVENING_AVAILABILITY: MoonStar,
  NUM_SESSION: UsersRound,
}

interface PsychologistCardProps {
  provider: Provider
}

export function PsychologistCard({ provider }: PsychologistCardProps) {
  const { userInfo, userName, profile } = provider
  const { providerInfo, providerTagInfo } = profile
  const fullName = `${userName.firstName} ${userName.lastName}`
  const hasTags = providerTagInfo.tags.length > 0
  const numberYearsExperience = Math.ceil(providerInfo.yearExperience ?? 0)
  const experienceText =
    numberYearsExperience > 1
      ? `${numberYearsExperience} years of experience`
      : `${numberYearsExperience} year of experience`

  return (
    <Card className="bg-card py-3.5 flex flex-col gap-3.5" tabIndex={0} aria-label={fullName}>
      <CardContent className="flex items-center gap-6">
        <Avatar className="size-18">
          <AvatarImage
            src={userInfo.avatar || ''}
            alt={`Profile photo of ${fullName}`}
            className=" object-cover shrink-0"
          />
          <AvatarFallback className="font-medium bg-peach-100 text-peach-600 text-xl">
            {fullName.slice(0, 2).toLocaleUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-medium text-primary text-base leading-tight truncate mb-1">
            {fullName}
          </p>
          <p className="text-sm text-primary/80">{experienceText}</p>
          <p className="text-sm text-primary/80">
            {capitalize(providerInfo.providerTitle || DEFAULT_PROVIDER_TITLE)}
          </p>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="overflow-x-auto gap-2">
        {hasTags ? (
          providerTagInfo.tags
            .slice(0, 2)
            .map((tag) => <PsychologistTag key={tag.text + tag.type} tag={tag} />)
        ) : (
          <PsychologistTag tag={DEFAULT_TAG} />
        )}
      </CardFooter>
    </Card>
  )
}

function PsychologistTag({ tag }: { tag: ProviderTag }) {
  const TagIcon = tagsIcon[tag.type] ?? DEFAULT_TAG_ICON
  return (
    <div className="text-xs py-1 rounded-full bg-peach-50 text-primary/90 font-medium flex items-center gap-1">
      <TagIcon className="size-3.5" /> <span className="pt-0.5">{tag.text}</span>
    </div>
  )
}
