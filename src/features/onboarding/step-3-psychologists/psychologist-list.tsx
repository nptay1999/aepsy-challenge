import { LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePsychologistSearch } from '@/services/hooks/use-psychologist-search'
import { PsychologistCard } from './psychologist-card'
import { PsychologistCardSkeleton } from './psychologist-card-skeleton'

interface PsychologistListProps {
  onBack: () => void
}

export function PsychologistList({ onBack }: PsychologistListProps) {
  const { providers, isLoading, isLoadingMore, canLoadMore, error, loadMore, retry } =
    usePsychologistSearch()

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading psychologists"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PsychologistCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 w-full py-12">
        <p role="alert" className="text-destructive text-sm text-center">
          Something went wrong while searching for psychologists.
        </p>
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 w-full py-12">
        <p className="text-muted-foreground text-sm text-center">
          No psychologists found for your selected topics.
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to Topics
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider, i) => (
          <PsychologistCard key={provider.userInfo.firebaseUid ?? i} provider={provider} />
        ))}
      </div>
      {canLoadMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin mr-2" />
                Loading…
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
