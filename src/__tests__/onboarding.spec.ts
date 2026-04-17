/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

/**
 * Injected before page load to replace getUserMedia + MediaRecorder with fakes.
 * getUserMedia resolves immediately with a fake MediaStream.
 */
function grantMockScript() {
  class FakeMediaStream {
    getTracks() {
      return [{ stop() {} }]
    }
  }

  class FakeMediaRecorder {
    static isTypeSupported(type: string) {
      return type === 'audio/webm;codecs=opus' || type === 'audio/webm'
    }

    state = 'inactive'
    mimeType: string
    ondataavailable: ((e: Event) => void) | null = null
    onstop: ((e: Event) => void) | null = null
    onerror: ((e: Event) => void) | null = null

    constructor(_stream: unknown, options: { mimeType?: string } = {}) {
      this.mimeType = options.mimeType ?? 'audio/webm'
    }

    start(_timeslice?: number) {
      this.state = 'recording'
      setTimeout(() => {
        if (this.ondataavailable) {
          const e = new Event('dataavailable')
          ;(e as unknown as { data: Blob }).data = new Blob(['fake-audio'], {
            type: this.mimeType,
          })
          this.ondataavailable(e)
        }
      }, 0)
    }

    stop() {
      this.state = 'inactive'
      setTimeout(() => {
        if (this.onstop) this.onstop(new Event('stop'))
      }, 0)
    }

    pause() {
      this.state = 'paused'
    }
    resume() {
      this.state = 'recording'
    }
  }

  // @ts-expect-error replacing globals
  window.MediaRecorder = FakeMediaRecorder

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: () => Promise.resolve(new FakeMediaStream()),
    },
    writable: true,
    configurable: true,
  })
}

/**
 * Same as grantMockScript but getUserMedia resolves after a 300ms delay,
 * making the requesting-permission state observable in tests.
 */
function slowGrantMockScript() {
  class FakeMediaStream {
    getTracks() {
      return [{ stop() {} }]
    }
  }

  class FakeMediaRecorder {
    static isTypeSupported(type: string) {
      return type === 'audio/webm;codecs=opus' || type === 'audio/webm'
    }

    state = 'inactive'
    mimeType: string
    ondataavailable: ((e: Event) => void) | null = null
    onstop: ((e: Event) => void) | null = null
    onerror: ((e: Event) => void) | null = null

    constructor(_stream: unknown, options: { mimeType?: string } = {}) {
      this.mimeType = options.mimeType ?? 'audio/webm'
    }

    start(_timeslice?: number) {
      this.state = 'recording'
      setTimeout(() => {
        if (this.ondataavailable) {
          const e = new Event('dataavailable')
          ;(e as unknown as { data: Blob }).data = new Blob(['fake-audio'], {
            type: this.mimeType,
          })
          this.ondataavailable(e)
        }
      }, 0)
    }

    stop() {
      this.state = 'inactive'
      setTimeout(() => {
        if (this.onstop) this.onstop(new Event('stop'))
      }, 0)
    }

    pause() {
      this.state = 'paused'
    }
    resume() {
      this.state = 'recording'
    }
  }

  // @ts-expect-error replacing globals
  window.MediaRecorder = FakeMediaRecorder

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: () =>
        new Promise((resolve) => setTimeout(() => resolve(new FakeMediaStream()), 300)),
    },
    writable: true,
    configurable: true,
  })
}

/**
 * Same as grantMockScript but ondataavailable produces a real 1-second silent WAV
 * so WaveSurfer can decode it and respond to play/pause/seek in headless Chromium.
 * decodeAudioData sniffs format from magic bytes, so the WAV decodes correctly
 * regardless of the blob's MIME type.
 */
function grantMockWithAudioScript() {
  class FakeMediaStream {
    getTracks() {
      return [{ stop() {} }]
    }
  }

  class FakeMediaRecorder {
    static isTypeSupported(type: string) {
      return type === 'audio/webm;codecs=opus' || type === 'audio/webm'
    }

    state = 'inactive'
    mimeType: string
    ondataavailable: ((e: Event) => void) | null = null
    onstop: ((e: Event) => void) | null = null
    onerror: ((e: Event) => void) | null = null

    constructor(_stream: unknown, _options: { mimeType?: string } = {}) {
      // Force audio/wav so the blob URL carries the correct content type for
      // both Chrome and Webkit to decode the WAV bytes reliably
      this.mimeType = 'audio/wav'
    }

    start(_timeslice?: number) {
      this.state = 'recording'
      setTimeout(() => {
        if (this.ondataavailable) {
          // Generate a 1-second silent WAV at 8000 Hz, 16-bit, mono
          const sampleRate = 8000
          const numSamples = sampleRate
          const dataSize = numSamples * 2
          const buf = new ArrayBuffer(44 + dataSize)
          const v = new DataView(buf)
          // RIFF
          v.setUint8(0, 0x52)
          v.setUint8(1, 0x49)
          v.setUint8(2, 0x46)
          v.setUint8(3, 0x46)
          v.setUint32(4, 36 + dataSize, true)
          // WAVE
          v.setUint8(8, 0x57)
          v.setUint8(9, 0x41)
          v.setUint8(10, 0x56)
          v.setUint8(11, 0x45)
          // fmt
          v.setUint8(12, 0x66)
          v.setUint8(13, 0x6d)
          v.setUint8(14, 0x74)
          v.setUint8(15, 0x20)
          v.setUint32(16, 16, true)
          v.setUint16(20, 1, true) // PCM
          v.setUint16(22, 1, true) // mono
          v.setUint32(24, sampleRate, true)
          v.setUint32(28, sampleRate * 2, true) // byte rate
          v.setUint16(32, 2, true) // block align
          v.setUint16(34, 16, true) // bits per sample
          // data
          v.setUint8(36, 0x64)
          v.setUint8(37, 0x61)
          v.setUint8(38, 0x74)
          v.setUint8(39, 0x61)
          v.setUint32(40, dataSize, true)
          // samples remain zero (silence)

          const e = new Event('dataavailable')
          ;(e as unknown as { data: Blob }).data = new Blob([buf], { type: this.mimeType })
          this.ondataavailable(e)
        }
      }, 0)
    }

    stop() {
      this.state = 'inactive'
      setTimeout(() => {
        if (this.onstop) this.onstop(new Event('stop'))
      }, 0)
    }

    pause() {
      this.state = 'paused'
    }
    resume() {
      this.state = 'recording'
    }
  }

  // @ts-expect-error replacing globals
  window.MediaRecorder = FakeMediaRecorder

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: () => Promise.resolve(new FakeMediaStream()),
    },
    writable: true,
    configurable: true,
  })
}

/**
 * getUserMedia rejects with NotAllowedError after a 50ms delay.
 * The delay lets React flush the requesting-permission render before the
 * rejection batches in alongside it (React 19 concurrent batching otherwise
 * collapses the two state updates into one with an immediate Promise.reject).
 */
function denyMockScript() {
  class FakeMediaRecorder {
    static isTypeSupported() {
      return false
    }
  }

  // @ts-expect-error replacing globals
  window.MediaRecorder = FakeMediaRecorder

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: () =>
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })),
            50,
          ),
        ),
    },
    writable: true,
    configurable: true,
  })
}

// ---------------------------------------------------------------------------
// Tests — permission denied
// ---------------------------------------------------------------------------

test.describe('voice recording — permission denied', () => {
  // Test 5: Error state shown on deny, Try again re-triggers getUserMedia
  test('permission denied shows error state; Try again re-triggers getUserMedia', async ({
    page,
    context,
  }) => {
    await context.addInitScript(denyMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()

    // "Try again" calls start() which sets phase → 'requesting', fires getUserMedia again
    await page.getByRole('button', { name: 'Try again' }).click()
    // The requesting-permission spinner appears (getUserMedia was re-triggered)
    await expect(page.getByRole('status')).toBeVisible()
    // Then error reappears because deny mock is still active
    await expect(page.getByRole('alert')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — recording timer
// ---------------------------------------------------------------------------

test.describe('voice recording — timer', () => {
  test('timer shows 0:00 at recording start', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    await expect(page.getByText('0:00')).toBeVisible()
  })

  test('timer increments each second while recording', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    await page.clock.runFor(3000)
    await expect(page.getByText('0:03')).toBeVisible()
  })

  test('timer is not shown after stopping', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await page.clock.runFor(100)

    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByText('0:00', { exact: true })).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — auto-stop at 2 minutes
// ---------------------------------------------------------------------------

test.describe('voice recording — auto-stop', () => {
  test('recording stops automatically after 2 minutes', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    // Advance 2 minutes — fires auto-stop timeout and the FakeMediaRecorder onstop
    await page.clock.runFor(120_000)
    await page.clock.runFor(100)

    // Should be in stopped state (Re-record visible) without manual stop
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).not.toBeVisible()
  })

  test('max-duration notice appears after auto-stop', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    await page.clock.runFor(120_000)
    await page.clock.runFor(100)

    await expect(page.getByText('Maximum recording length reached')).toBeVisible()
  })

  test('max-duration notice is gone after re-record', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.clock.runFor(120_000)
    await page.clock.runFor(100)
    await expect(page.getByText('Maximum recording length reached')).toBeVisible()

    await page.getByRole('button', { name: 'Re-record' }).click()
    await expect(page.getByText('Maximum recording length reached')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — live visualizer
// ---------------------------------------------------------------------------

test.describe('voice recording — live visualizer', () => {
  test('visualizer is visible while recording', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    await expect(page.getByLabel('Audio visualizer')).toBeVisible()
  })

  test('visualizer is not shown after stopping', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()

    await expect(page.getByLabel('Audio visualizer')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — duration gate
// ---------------------------------------------------------------------------

test.describe('voice recording — duration gate', () => {
  test('Continue is enabled after recording ≥5 seconds', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    // runFor fires all intermediate setInterval(updateDuration, 1000) callbacks
    await page.clock.runFor(5000)

    await page.getByRole('button', { name: 'Stop Recording' }).click()
    // Flush zero-delay setTimeout(onstop) in FakeMediaRecorder
    await page.clock.runFor(100)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  test('Continue is disabled after recording <5 seconds', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    // Stop immediately (0 seconds elapsed)
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    // Flush zero-delay setTimeout(onstop) in FakeMediaRecorder
    await page.clock.runFor(100)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Tests — permission granted
// ---------------------------------------------------------------------------

test.describe('voice recording — permission granted', () => {
  // Test 1: Tracer bullet — idle → recording → stopped
  test('full happy path: idle → recording → stopped', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible()

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  // Test 2: requesting-permission loading state is shown during slow getUserMedia
  test('shows loading indicator while requesting permission', async ({ page, context }) => {
    await context.addInitScript(slowGrantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('status')).toBeVisible()

    // Eventually transitions to recording
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()
  })

  // Test 3: Re-record returns to idle
  test('re-record returns to idle state', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()

    await page.getByRole('button', { name: 'Re-record' }).click()
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible()
  })

  // Test 4: Second recording cycle completes without stale state
  test('second recording cycle completes correctly', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    // First cycle
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await page.getByRole('button', { name: 'Re-record' }).click()

    // Second cycle — must reach stopped state cleanly
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  // Test 6: Continue button is present but disabled in stopped state
  test('continue button is disabled after recording stops', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()

    const continueBtn = page.getByRole('button', { name: 'Continue' })
    await expect(continueBtn).toBeVisible()
    await expect(continueBtn).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Tests — playback controls
// ---------------------------------------------------------------------------

test.describe('voice recording — playback controls', () => {
  test('stopped state shows audio player and play button', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()

    await expect(page.getByLabel('Audio waveform')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('playback position display is shown in stopped state', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()

    await expect(page.getByLabel('Playback position')).toBeVisible()
  })

  test('play/pause button toggles label', async ({ page, context, browserName }) => {
    // Playwright's Webkit engine does not support fetching blob URLs for audio
    // decoding (WaveSurfer v7 uses fetch() internally). Real Safari works fine.
    test.skip(browserName === 'webkit', 'blob URL audio decoding unavailable in Playwright Webkit')
    await context.addInitScript(grantMockWithAudioScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()

    // Wait for WaveSurfer to decode the audio — decoded duration replaces the 0:00 fallback
    await expect(page.getByLabel('Playback position')).toContainText('0:01')

    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('re-record unmounts audio player', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByLabel('Audio waveform')).toBeVisible()

    await page.getByRole('button', { name: 'Re-record' }).click()
    await expect(page.getByLabel('Audio waveform')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible()
  })

  test('audio player is not shown during recording', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    await expect(page.getByLabel('Audio waveform')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Tests — session persistence
// ---------------------------------------------------------------------------

test.describe('voice recording — session persistence', () => {
  test('recording is written to sessionStorage after stop', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()

    await page.waitForFunction(() => {
      const r = sessionStorage.getItem('aepsy_onboarding')
      if (!r) return false
      try {
        return JSON.parse(r).state?.audioBase64 != null
      } catch {
        return false
      }
    })

    const raw = await page.evaluate(() => sessionStorage.getItem('aepsy_onboarding'))
    const parsed = JSON.parse(raw!).state
    expect(parsed.audioBase64).toBeTruthy()
    expect(parsed.mimeType).toBeTruthy()
    expect(typeof parsed.durationMs).toBe('number')
  })

  test('stopped state is restored after page reload', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()

    await page.waitForFunction(() => {
      const r = sessionStorage.getItem('aepsy_onboarding')
      if (!r) return false
      try {
        return JSON.parse(r).state?.audioBase64 != null
      } catch {
        return false
      }
    })
    await page.reload()

    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Recording' })).not.toBeVisible()
    await expect(page.getByLabel('Audio waveform')).toBeVisible()
  })

  test('Continue is enabled after reload when saved duration ≥5s', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    // Pre-seed sessionStorage so we don't have to wait 5 real seconds
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'aepsy_onboarding',
        JSON.stringify({
          state: {
            audioBase64: btoa('fake-audio'),
            mimeType: 'audio/webm;codecs=opus',
            durationMs: 10000,
            recordedAt: new Date().toISOString(),
            selectedTopics: [],
          },
          version: 0,
        }),
      )
    })
    await page.goto('/onboarding')

    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  test('Continue is disabled after reload when saved duration <5s', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'aepsy_onboarding',
        JSON.stringify({
          state: {
            audioBase64: btoa('fake-audio'),
            mimeType: 'audio/webm;codecs=opus',
            durationMs: 2000,
            recordedAt: new Date().toISOString(),
            selectedTopics: [],
          },
          version: 0,
        }),
      )
    })
    await page.goto('/onboarding')

    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('re-record clears sessionStorage so reload returns to idle', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await page.getByRole('button', { name: 'Stop Recording' }).click()
    await page.waitForFunction(() => {
      const r = sessionStorage.getItem('aepsy_onboarding')
      if (!r) return false
      try {
        return JSON.parse(r).state?.audioBase64 != null
      } catch {
        return false
      }
    })

    await page.getByRole('button', { name: 'Re-record' }).click()
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible()

    const audioBase64 = await page.evaluate(() => {
      const r = sessionStorage.getItem('aepsy_onboarding')
      if (!r) return null
      try {
        return JSON.parse(r).state?.audioBase64 ?? null
      } catch {
        return null
      }
    })
    expect(audioBase64).toBeNull()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible()
  })

  test('partial recording saved on mid-recording page reload (best-effort)', async ({
    page,
    context,
  }) => {
    await context.addInitScript(grantMockScript)
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    // Wait for the 2 s debounced encode to complete before reloading
    await page.waitForTimeout(2500)

    // page.reload() fires beforeunload, which writes lastPartialSaveRef to sessionStorage
    await page.reload()

    await expect(page.getByRole('button', { name: 'Re-record' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Recording' })).not.toBeVisible()
  })

  test('tab switch does not interrupt recording', async ({ page, context }) => {
    await context.addInitScript(grantMockScript)
    await page.clock.install()
    await page.goto('/onboarding')

    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()

    // Simulate tab hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await page.clock.runFor(3000)
    await expect(page.getByText('0:03')).toBeVisible()

    // Simulate tab visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Recording still active
    await expect(page.getByRole('button', { name: 'Stop Recording' })).toBeVisible()
  })
})
