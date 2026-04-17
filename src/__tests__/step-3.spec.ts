import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOPICS_PAYLOAD = JSON.stringify({
  state: {
    audioBase64: null,
    mimeType: '',
    durationMs: 0,
    recordedAt: null,
    selectedTopics: [
      { value: 'U_DIS_DEPRESSION', label: 'Feeling down' },
      { value: 'U_DIS_STRESS', label: 'Stress' },
    ],
  },
  version: 0,
})

const TOPICS_AND_AUDIO_PAYLOAD = JSON.stringify({
  state: {
    audioBase64: btoa('fake-audio'),
    mimeType: 'audio/webm;codecs=opus',
    durationMs: 10000,
    recordedAt: new Date().toISOString(),
    selectedTopics: [
      { value: 'U_DIS_DEPRESSION', label: 'Feeling down' },
      { value: 'U_DIS_STRESS', label: 'Stress' },
    ],
  },
  version: 0,
})

function makeProvider(overrides: {
  uid?: string
  firstName?: string
  lastName?: string
  title?: string
  years?: number
  tags?: { type: string; subType: string; text: string }[]
  avatar?: string | null
}) {
  return {
    userInfo: { firebaseUid: overrides.uid ?? 'uid-1', avatar: overrides.avatar ?? null },
    userName: { firstName: overrides.firstName ?? 'Anna', lastName: overrides.lastName ?? 'Smith' },
    profile: {
      providerInfo: {
        yearExperience: overrides.years ?? 5,
        providerTitle: overrides.title ?? 'Psychotherapist',
      },
      providerTagInfo: { tags: overrides.tags ?? [] },
    },
  }
}

function successResponse(providers: object[], canLoadMore = false) {
  return {
    data: {
      searchProviders: {
        id: 'search-1',
        providers: { canLoadMore, totalSize: providers.length, providers },
      },
    },
  }
}

function emptyResponse() {
  return successResponse([])
}

function errorResponse() {
  return { errors: [{ message: 'Internal server error' }] }
}

/** Seed sessionStorage with topics so Step 3 has rawDisorders to query with. */
async function seedTopics(page: import('@playwright/test').Page) {
  await page.evaluate((payload) => {
    sessionStorage.setItem('aepsy_onboarding', payload)
  }, TOPICS_PAYLOAD)
}

/** Navigate to /onboarding, seed topics, click Step 3 tab. */
async function goToStep3(
  page: import('@playwright/test').Page,
  mockFn: (route: import('@playwright/test').Route) => Promise<void>,
) {
  await page.route('**/graphql', mockFn)
  await page.goto('/onboarding')
  await seedTopics(page)
  // Navigate directly to step 3 via tab (stepper allows direct tab clicks)
  await page.getByRole('tab').nth(2).click()
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

test.describe('step 3 — loading state', () => {
  test('shows 6 skeleton cards while initial query is in-flight', async ({ page }) => {
    let resolve!: () => void
    const pending = new Promise<void>((r) => (resolve = r))

    await goToStep3(page, async (route) => {
      await pending // hold the response
      await route.fulfill({ json: successResponse([makeProvider({})]) })
    })

    const skeletons = page.getByRole('status', { name: 'Loading psychologists' })
    await expect(skeletons).toBeVisible()

    resolve()
  })
})

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

test.describe('step 3 — success state', () => {
  test('renders provider cards with name, title, and years of experience', async ({ page }) => {
    const provider = makeProvider({
      firstName: 'Maria',
      lastName: 'Gonzalez',
      title: 'Psychotherapist',
      years: 7,
    })

    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([provider]) })
    })

    await expect(page.getByText('Maria Gonzalez')).toBeVisible()
    await expect(page.getByText('Psychotherapist')).toBeVisible()
    await expect(page.getByText('7 years of experience')).toBeVisible()
  })

  test('avatar image has descriptive alt text', async ({ page }) => {
    const provider = makeProvider({
      firstName: 'Lena',
      lastName: 'Bauer',
      avatar: 'https://example.com/avatar.jpg',
    })

    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([provider]) })
    })

    await expect(page.getByAltText('Profile photo of Lena Bauer')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

test.describe('step 3 — tags', () => {
  test('footer row is shown when provider has tags', async ({ page }) => {
    const provider = makeProvider({
      tags: [{ type: 'OFFERING', subType: 'SUB', text: 'Flexible offerings' }],
    })

    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([provider]) })
    })

    await expect(page.getByText('Flexible offerings')).toBeVisible()
  })

  test('footer row is absent when provider has no tags', async ({ page }) => {
    const provider = makeProvider({ tags: [] })

    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([provider]) })
    })

    await expect(page.getByText('Flexible offerings')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Pagination / Load More
// ---------------------------------------------------------------------------

test.describe('step 3 — load more', () => {
  test('"Load More" button is visible when canLoadMore is true', async ({ page }) => {
    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([makeProvider({})], true) })
    })

    await expect(page.getByRole('button', { name: 'Load More' })).toBeVisible()
  })

  test('"Load More" button is absent when canLoadMore is false', async ({ page }) => {
    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([makeProvider({})], false) })
    })

    await expect(page.getByRole('button', { name: 'Load More' })).not.toBeVisible()
  })

  test('clicking "Load More" appends new cards below existing ones', async ({ page }) => {
    // Use pageNum from the request body to distinguish initial load vs load more.
    // This is stable under React StrictMode's double-effect invocation since both
    // initial calls use pageNum=1, and Load More sends pageNum=2.
    await goToStep3(page, async (route) => {
      const body = route.request().postDataJSON() as { variables: { pageNum: number } }
      const pageNum = body.variables?.pageNum ?? 1
      if (pageNum === 1) {
        await route.fulfill({
          json: successResponse(
            [makeProvider({ uid: 'uid-1', firstName: 'Anna', lastName: 'First' })],
            true,
          ),
        })
      } else {
        await route.fulfill({
          json: successResponse(
            [makeProvider({ uid: 'uid-2', firstName: 'Bob', lastName: 'Second' })],
            false,
          ),
        })
      }
    })

    await expect(page.getByText('Anna First')).toBeVisible()
    await page.getByRole('button', { name: 'Load More' }).click()

    await expect(page.getByText('Anna First')).toBeVisible()
    await expect(page.getByText('Bob Second')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Load More' })).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

test.describe('step 3 — empty state', () => {
  test('shows empty message and "Back to Topics" button when no results', async ({ page }) => {
    await goToStep3(page, async (route) => {
      await route.fulfill({ json: emptyResponse() })
    })

    await expect(page.getByText(/no psychologists found/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Topics' })).toBeVisible()
  })

  test('"Back to Topics" navigates to Step 2', async ({ page }) => {
    await goToStep3(page, async (route) => {
      await route.fulfill({ json: emptyResponse() })
    })

    await page.getByRole('button', { name: 'Back to Topics' }).click()

    await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true')
  })
})

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

test.describe('step 3 — error state', () => {
  test('shows error alert and "Try again" button on GraphQL failure', async ({ page }) => {
    await goToStep3(page, async (route) => {
      await route.fulfill({ json: errorResponse() })
    })

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('"Try again" re-fetches and shows results on success', async ({ page }) => {
    // Use a mutable flag to switch from error → success after clicking "Try again".
    // This is stable under React StrictMode: all initial calls return error, the
    // explicit retry (triggered by user action) gets the success response.
    let returnError = true

    await page.route('**/graphql', async (route) => {
      if (returnError) {
        await route.fulfill({ json: errorResponse() })
      } else {
        await route.fulfill({
          json: successResponse([makeProvider({ firstName: 'Jan', lastName: 'Retry' })]),
        })
      }
    })

    await page.goto('/onboarding')
    await seedTopics(page)
    await page.getByRole('tab').nth(2).click()

    await expect(page.getByRole('alert')).toBeVisible()

    returnError = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText('Jan Retry')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe('step 3 — navigation', () => {
  test('"Back" button in content area navigates to Step 2', async ({ page }) => {
    await goToStep3(page, async (route) => {
      await route.fulfill({ json: successResponse([makeProvider({})]) })
    })

    await page.getByRole('button', { name: 'Back', exact: true }).click()

    await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true')
  })

  test('topic selections are preserved when returning to Step 2', async ({ page }) => {
    await page.addInitScript((payload) => {
      sessionStorage.setItem('aepsy_onboarding', payload)
    }, TOPICS_AND_AUDIO_PAYLOAD)

    await page.route('**/graphql', async (route) => {
      await route.fulfill({ json: successResponse([makeProvider({})]) })
    })

    await page.goto('/onboarding')
    await page.getByRole('tab').nth(2).click()

    await page.getByRole('button', { name: 'Back', exact: true }).click()

    // Step 2 should be active
    await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true')

    // Wait for chips to load and verify topics from sessionStorage are retained
    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: 'Feeling down' })).toHaveClass(/bg-peach-500/)
  })
})
