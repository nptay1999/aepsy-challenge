import { useEffect, useState } from 'react'
import { TopicChip } from '@/components/ui/chip'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAudioTranscriber } from '@/hooks/use-audio-transcriber'
import { useShallow } from 'zustand/react/shallow'
import { useOnboardingStore } from '@/features/onboarding/onboarding.store'
import type { DisorderOption } from '@/features/onboarding/onboarding.store'

interface TopicSelectionStepProps {
  onNext: (topics: DisorderOption[]) => void
}

export function TopicSelectionStep({ onNext }: TopicSelectionStepProps) {
  const { isLoading, data, error, processAudio } = useAudioTranscriber()
  const {
    selectedTopics: savedTopics,
    audioBase64,
    mimeType,
    setSelectedTopics,
  } = useOnboardingStore(
    useShallow((state) => ({
      selectedTopics: state.selectedTopics,
      audioBase64: state.audioBase64,
      mimeType: state.mimeType,
      setSelectedTopics: state.setSelectedTopics,
    })),
  )

  const [rawSelectedTopics, setRawSelectedTopics] = useState<DisorderOption[]>(() => savedTopics)

  const selectedTopics = data
    ? rawSelectedTopics.filter((t) => data.some((d) => d.value === t.value))
    : rawSelectedTopics

  const triggerTranscription = () => {
    if (audioBase64 && mimeType) {
      const bytes = atob(audioBase64)
      const array = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i)
      processAudio(array)
    } else {
      processAudio(new Uint8Array(0))
    }
  }

  useEffect(() => {
    triggerTranscription()
  }, [])

  const toggleTopic = (option: DisorderOption) => {
    setRawSelectedTopics((prev) => {
      const next = prev.some((t) => t.value === option.value)
        ? prev.filter((t) => t.value !== option.value)
        : [...prev, option]
      setSelectedTopics(next)
      return next
    })
  }

  const canContinue = selectedTopics.length > 0 && !isLoading && !error

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-xl">
        <div role="status" aria-label="Loading topics" className="flex flex-wrap gap-2">
          {Array.from({ length: 25 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Button disabled className="self-end">
          Continue
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-xl">
        <p role="alert" className="text-destructive text-sm text-center">
          Something went wrong while processing your recording.
        </p>
        <Button variant="outline" onClick={triggerTranscription}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <div className="flex flex-wrap gap-2">
        {(data ?? []).map((option) => (
          <TopicChip
            key={option.value + option.label}
            label={option.label}
            selected={selectedTopics.some((t) => t.value === option.value)}
            onClick={() => toggleTopic(option)}
          />
        ))}
      </div>
      <Button disabled={!canContinue} onClick={() => onNext(selectedTopics)} className="self-end">
        Continue
      </Button>
    </div>
  )
}
