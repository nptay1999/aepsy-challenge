import { useLazyQuery } from '@apollo/client/react'
import { useEffect, useState } from 'react'
import { SEARCH_PROVIDERS } from '@/services/queries'
import { get } from 'es-toolkit/compat'
import { useOnboardingStore } from '@/features/onboarding/onboarding.store'

export type ProviderTag = {
  type: string
  subType: string
  text: string
}

export type Provider = {
  userInfo: { firebaseUid: string; avatar: string | null }
  userName: { firstName: string; lastName: string }
  profile: {
    providerInfo: { yearExperience: number; providerTitle: string }
    providerTagInfo: { tags: ProviderTag[] }
  }
}

export type ProvidersResponse = {
  canLoadMore: boolean
  totalSize: number
  providers: Provider[]
}

export type SearchProvidersData = {
  searchProviders: {
    id: string
    providers: ProvidersResponse
  }
}

const PAGE_SIZE = 6

export function usePsychologistSearch() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [pageNum, setPageNum] = useState(1)
  const [canLoadMore, setCanLoadMore] = useState(false)

  const selectedTopics = useOnboardingStore((state) => state.selectedTopics)

  const [executeQuery, { loading, error }] = useLazyQuery<SearchProvidersData>(SEARCH_PROVIDERS, {
    fetchPolicy: 'network-only',
  })

  const isLoadingMore = loading && providers.length > 0
  const isLoading = loading && providers.length === 0

  const rawDisorders = selectedTopics.map((t) => t.value)

  useEffect(() => {
    executeQuery({ variables: { rawDisorders, pageSize: PAGE_SIZE, pageNum: 1 } }).then(
      (result) => {
        if (!result.data) return
        const page = get(result, 'data.searchProviders.providers') as ProvidersResponse
        setProviders(page.providers)
        setCanLoadMore(page.canLoadMore)
      },
    )
  }, [executeQuery, rawDisorders])

  const loadMore = async () => {
    const nextPage = pageNum + 1
    setPageNum(nextPage)
    const result = await executeQuery({
      variables: { rawDisorders, pageSize: PAGE_SIZE, pageNum: nextPage },
    })
    if (result.data) {
      const page = get(result, 'data.searchProviders.providers') as ProvidersResponse
      setProviders((prev) => [...prev, ...page.providers])
      setCanLoadMore(page.canLoadMore)
    }
  }

  const retry = async () => {
    setProviders([])
    setPageNum(1)
    const result = await executeQuery({
      variables: { rawDisorders, pageSize: PAGE_SIZE, pageNum: 1 },
    })
    if (result.data) {
      const page = result.data.searchProviders.providers
      setProviders(page.providers)
      setCanLoadMore(page.canLoadMore)
    }
  }

  return { providers, isLoading, isLoadingMore, canLoadMore, error, loadMore, retry }
}
