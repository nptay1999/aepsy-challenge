import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AUDIO_DATA = {
  audioBase64: btoa('fake-audio'),
  mimeType: 'audio/webm;codecs=opus',
  durationMs: 10000,
  recordedAt: new Date().toISOString(),
}

const ONBOARDING_PAYLOAD_WITH_AUDIO = JSON.stringify({
  state: { ...AUDIO_DATA, selectedTopics: [] },
  version: 0,
})

/** Navigate to the onboarding page, optionally seed audio, then click step 2 tab. */
async function goToStep2(
  page: import('@playwright/test').Page,
  { withAudio = true }: { withAudio?: boolean } = {},
) {
  await page.goto('/onboarding')
  if (withAudio) {
    await page.evaluate(
      (payload) => sessionStorage.setItem('aepsy_onboarding', payload),
      ONBOARDING_PAYLOAD_WITH_AUDIO,
    )
    await page.evaluate((data) => {
      const store = (window as Record<string, unknown>).__onboardingStore as
        | { setState: (s: object) => void }
        | undefined
      store?.setState(data)
    }, AUDIO_DATA)
  }
  await page.getByRole('tab').nth(1).click()
}

// ---------------------------------------------------------------------------
// Tests — loading state
// ---------------------------------------------------------------------------

test.describe('step 2 — loading state', () => {
  test('skeleton chips are shown immediately while transcription is pending', async ({ page }) => {
    await goToStep2(page)

    await expect(page.getByRole('status', { name: 'Loading topics' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('topic chips appear and skeletons are gone after transcription resolves', async ({
    page,
  }) => {
    await goToStep2(page)

    // Wait for skeletons to disappear (transcription resolves after 2s mock delay)
    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    // At least one chip should be visible (hook returns 50 topics)
    await expect(page.getByRole('button', { name: 'Feeling down' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — chip selection
// ---------------------------------------------------------------------------

test.describe('step 2 — chip selection', () => {
  test('Continue button is disabled when no topics are selected', async ({ page }) => {
    await goToStep2(page)

    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('clicking a chip selects it; clicking again deselects it', async ({ page }) => {
    await goToStep2(page)

    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    const chip = page.getByRole('button', { name: 'Feeling down' })

    // Select
    await chip.click()
    await expect(chip).toHaveClass(/bg-peach-500/)

    // Deselect
    await chip.click()
    await expect(chip).not.toHaveClass(/bg-peach-500/)
  })

  test('Continue button enables after at least one chip is selected', async ({ page }) => {
    await goToStep2(page)

    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    await page.getByRole('button', { name: 'Feeling down' }).click()

    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  test('"Others" chip is selectable like any other chip', async ({ page }) => {
    await goToStep2(page)

    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    const othersChip = page.getByRole('button', { name: 'Others' })
    await othersChip.click()

    await expect(othersChip).toHaveClass(/bg-peach-500/)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Tests — error state
// ---------------------------------------------------------------------------

test.describe('step 2 — error state', () => {
  test('error message and Try again button are shown on transcription failure', async ({
    page,
  }) => {
    // No audio seeded → processAudio(empty) → error
    await goToStep2(page, { withAudio: false })

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('clicking Try again re-triggers transcription and shows skeletons', async ({ page }) => {
    await goToStep2(page, { withAudio: false })

    // Wait for error state
    await expect(page.getByRole('alert')).toBeVisible()

    // Update in-memory store with audio so next attempt succeeds
    await page.evaluate((data) => {
      const store = (window as Record<string, unknown>).__onboardingStore as
        | { setState: (s: object) => void }
        | undefined
      store?.setState(data)
    }, AUDIO_DATA)

    await page.getByRole('button', { name: 'Try again' }).click()

    // Loading skeletons should appear
    await expect(page.getByRole('status', { name: 'Loading topics' })).toBeVisible()

    // Then chips appear after transcription resolves
    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: 'Feeling down' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — session persistence
// ---------------------------------------------------------------------------

test.describe('step 2 — session persistence', () => {
  test('page reload on step 2 restores previously selected topics', async ({ page }) => {
    await page.addInitScript((payload) => {
      sessionStorage.setItem('aepsy_onboarding', payload)
    }, ONBOARDING_PAYLOAD_WITH_AUDIO)

    await page.goto('/onboarding')
    await page.getByRole('tab').nth(1).click()

    // Wait for chips to load
    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    // Select two chips
    await page.getByRole('button', { name: 'Feeling down' }).click()
    await page.getByRole('button', { name: 'Stress' }).click()

    // Reload
    await page.reload()

    // Navigate to step 2 again
    await page.getByRole('tab').nth(1).click()

    // Wait for chips
    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    // Previously selected chips are restored
    await expect(page.getByRole('button', { name: 'Feeling down' })).toHaveClass(/bg-peach-500/)
    await expect(page.getByRole('button', { name: 'Stress' })).toHaveClass(/bg-peach-500/)
  })
})

// ---------------------------------------------------------------------------
// Tests — navigation to step 3
// ---------------------------------------------------------------------------

test.describe('step 2 — navigation', () => {
  test('clicking Continue advances to step 3', async ({ page }) => {
    await goToStep2(page)

    await expect(page.getByRole('status', { name: 'Loading topics' })).not.toBeVisible({
      timeout: 5000,
    })

    await page.getByRole('button', { name: 'Feeling down' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 tab should now be active (aria-selected)
    await expect(page.getByRole('tab').nth(2)).toHaveAttribute('aria-selected', 'true')
  })
})
