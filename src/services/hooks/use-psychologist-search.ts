import { useLazyQuery } from '@apollo/client/react'
import { useEffect, useRef, useState } from 'react'
import { SEARCH_PROVIDERS } from '@/services/queries'

interface ProviderTag {
  type: string
  subType: string
  text: string
}

export interface Provider {
  userInfo: { firebaseUid: string; avatar: string | null }
  userName: { firstName: string; lastName: string }
  profile: {
    providerInfo: { yearExperience: number; providerTitle: string }
    providerTagInfo: { tags: ProviderTag[] }
  }
}

interface SearchProvidersData {
  searchProviders: {
    id: string
    providers: {
      canLoadMore: boolean
      totalSize: number
      providers: Provider[]
    }
  }
}

function readTopicsFromSession(): string[] {
  try {
    const raw = sessionStorage.getItem('aepsy_selected_topics')
    if (!raw) return []
    const parsed = JSON.parse(raw) as { value: string }[]
    return parsed.map((t) => t.value)
  } catch {
    return []
  }
}

const PAGE_SIZE = 6

export function usePsychologistSearch() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [pageNum, setPageNum] = useState(1)
  const [canLoadMore, setCanLoadMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const rawDisordersRef = useRef<string[]>([])
  const appendRef = useRef(false)

  const [executeQuery, { data, loading, error }] = useLazyQuery<SearchProvidersData>(
    SEARCH_PROVIDERS,
    { fetchPolicy: 'network-only' },
  )

  // Show skeletons only on the initial fetch (no accumulated providers yet)
  const isLoading = loading && providers.length === 0 && !isLoadingMore

  // React to resolved query data
  useEffect(() => {
    if (!data) return
    const page = data.searchProviders.providers
    setProviders((prev) => (appendRef.current ? [...prev, ...page.providers] : page.providers))
    setCanLoadMore(page.canLoadMore)
    if (appendRef.current) {
      setPageNum((p) => p + 1)
      setIsLoadingMore(false)
    }
    appendRef.current = false
  }, [data])

  const runQuery = (page: number) => {
    executeQuery({
      variables: {
        rawDisorders: rawDisordersRef.current,
        pageSize: PAGE_SIZE,
        pageNum: page,
      },
    })
  }

  useEffect(() => {
    rawDisordersRef.current = readTopicsFromSession()
    runQuery(1)
  }, [])

  const loadMore = () => {
    appendRef.current = true
    setIsLoadingMore(true)
    runQuery(pageNum + 1)
  }

  const retry = () => {
    appendRef.current = false
    setProviders([])
    setPageNum(1)
    runQuery(1)
  }

  return { providers, isLoading, isLoadingMore, canLoadMore, error, loadMore, retry }
}
