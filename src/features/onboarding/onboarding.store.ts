import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface DisorderOption {
  value: string
  label: string
}

interface RecordingPayload {
  audioBase64: string
  mimeType: string
  durationMs: number
  recordedAt: string
}

interface OnboardingState {
  activeStep: number
  audioBase64: string | null
  mimeType: string
  durationMs: number
  recordedAt: string | null
  selectedTopics: DisorderOption[]
  setActiveStep: (step: number) => void
  setRecording: (payload: RecordingPayload) => void
  clearRecording: () => void
  setSelectedTopics: (topics: DisorderOption[]) => void
  clearSelectedTopics: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      activeStep: 1,
      audioBase64: null,
      mimeType: '',
      durationMs: 0,
      recordedAt: null,
      selectedTopics: [],
      setActiveStep: (step: number) => set({ activeStep: step }),
      setRecording: (payload) =>
        set({
          audioBase64: payload.audioBase64,
          mimeType: payload.mimeType,
          durationMs: payload.durationMs,
          recordedAt: payload.recordedAt,
        }),
      clearRecording: () =>
        set({ audioBase64: null, mimeType: '', durationMs: 0, recordedAt: null }),
      setSelectedTopics: (topics) => set({ selectedTopics: topics }),
      clearSelectedTopics: () => set({ selectedTopics: [] }),
    }),
    {
      name: 'aepsy_onboarding',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

// Expose store on window for Playwright tests to update in-memory state.
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__onboardingStore = useOnboardingStore
}
