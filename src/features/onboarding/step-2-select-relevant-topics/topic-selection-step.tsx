import { useEffect, useState } from 'react'
import { TopicChip } from '@/components/ui/chip'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAudioTranscriber } from '@/hooks/use-audio-transcriber'

interface DisorderOption {
  value: string
  label: string
}

interface TopicSelectionStepProps {
  onNext: (topics: DisorderOption[]) => void
}

const SESSION_AUDIO_KEY = 'aepsy_voice_recording'
const SESSION_TOPICS_KEY = 'aepsy_selected_topics'

function decodeAudioFromSession(): Uint8Array | null {
  try {
    const raw = sessionStorage.getItem(SESSION_AUDIO_KEY)
    if (!raw) return null
    const payload = JSON.parse(raw) as { audioBase64?: string }
    if (!payload.audioBase64) return null
    const binary = atob(payload.audioBase64)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i)
    }
    return array
  } catch {
    return null
  }
}

function loadSavedTopics(): DisorderOption[] {
  try {
    const raw = sessionStorage.getItem(SESSION_TOPICS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DisorderOption[]
  } catch {
    return []
  }
}

export function TopicSelectionStep({ onNext }: TopicSelectionStepProps) {
  const { isLoading, data, error, processAudio } = useAudioTranscriber()
  const [rawSelectedTopics, setRawSelectedTopics] = useState<DisorderOption[]>(() =>
    loadSavedTopics(),
  )

  const selectedTopics = data
    ? rawSelectedTopics.filter((t) => data.some((d) => d.value === t.value))
    : rawSelectedTopics

  const triggerTranscription = () => {
    const audio = decodeAudioFromSession()
    processAudio(audio ?? new Uint8Array(0))
  }

  useEffect(() => {
    triggerTranscription()
  }, [])

  const toggleTopic = (option: DisorderOption) => {
    setRawSelectedTopics((prev) => {
      const next = prev.some((t) => t.value === option.value)
        ? prev.filter((t) => t.value !== option.value)
        : [...prev, option]
      sessionStorage.setItem(SESSION_TOPICS_KEY, JSON.stringify(next))
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
