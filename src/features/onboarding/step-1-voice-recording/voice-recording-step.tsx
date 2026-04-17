import { useState } from 'react'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { AudioPlayer } from './audio-player'
import { LiveVisualizer } from './live-visualizer'
import { Button } from '@/components/ui/button'
import { Play, Square, RotateCcw, LoaderCircle } from 'lucide-react'

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getMicErrorInstructions(): { heading: string; steps: string[] } {
  const ua = navigator.userAgent

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    return {
      heading: 'Allow microphone access in Chrome',
      steps: [
        'Click the lock icon in the address bar.',
        'Set "Microphone" to "Allow".',
        'Reload the page and try again.',
      ],
    }
  }
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    return {
      heading: 'Allow microphone access in Safari',
      steps: [
        'Open Safari > Settings for this Website.',
        'Set Microphone to "Allow".',
        'Reload the page and try again.',
      ],
    }
  }
  if (/Firefox\//.test(ua)) {
    return {
      heading: 'Allow microphone access in Firefox',
      steps: [
        'Click the microphone icon in the address bar.',
        'Select "Allow".',
        'Reload the page and try again.',
      ],
    }
  }
  return {
    heading: 'Microphone access was denied',
    steps: [
      'Check your browser settings and allow microphone access for this site, then try again.',
    ],
  }
}

const cardClass = 'bg-transparent rounded-2xl p-8 max-w-md w-full animate-in fade-in duration-300'

interface VoiceRecordingStepProps {
  onComplete?: () => void
}

export function VoiceRecordingStep({ onComplete }: VoiceRecordingStepProps) {
  const [maxReached, setMaxReached] = useState(false)
  const { state, start, stop, reset, durationMs, audioUrl, stream } = useVoiceRecorder({
    onMaxDurationReached: () => setMaxReached(true),
  })

  if (state === 'idle') {
    return (
      <div className={`${cardClass} flex flex-col items-center gap-6`}>
        <Button
          onClick={start}
          size="icon"
          className="size-30 rounded-full bg-peach-500 hover:bg-peach-600 text-white"
        >
          <Play className="size-12 fill-current" />
        </Button>
        <span className="font-medium text-lg text-primary">Start Recording</span>
      </div>
    )
  }

  if (state === 'requesting-permission') {
    return (
      <div
        className={`${cardClass} flex flex-col items-center gap-4`}
        role="status"
        aria-label="Requesting microphone permission"
      >
        <LoaderCircle className="size-8 animate-spin text-peach-500" />
        <span className="text-gray-500">Waiting for microphone access…</span>
      </div>
    )
  }

  if (state === 'recording') {
    return (
      <div className={`${cardClass} flex flex-col items-center gap-6`}>
        <span className="text-4xl font-bold tabular-nums">{formatDuration(durationMs)}</span>
        <div className="w-full">{stream && <LiveVisualizer stream={stream} />}</div>
        <Button
          onClick={stop}
          className="rounded-full bg-peach-500 hover:bg-peach-600 text-white px-6"
          size="lg"
        >
          <Square className="size-3.5 fill-current mr-1.5" />
          Stop
        </Button>
      </div>
    )
  }

  if (state === 'stopped') {
    return (
      <div className={`${cardClass} flex flex-col gap-8`}>
        {audioUrl && <AudioPlayer audioUrl={audioUrl} durationMs={durationMs} />}
        {maxReached && (
          <p className="text-sm text-center text-gray-500">Maximum recording length reached</p>
        )}
        <div className="flex flex-col gap-3">
          {durationMs < 5000 && (
            <p className="text-sm text-center text-peach-500">
              Minimum recording time is 5 seconds
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              variant="default"
              className="rounded-full w-32"
              size="lg"
              onClick={() => {
                setMaxReached(false)
                reset()
              }}
            >
              <RotateCcw className="size-4" />
              Re-recording
            </Button>
            <Button
              className="rounded-full bg-peach-500 hover:bg-peach-600 text-white px-6 w-32"
              disabled={durationMs < 5000}
              size="lg"
              onClick={onComplete}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // state === 'error'
  const { heading, steps } = getMicErrorInstructions()
  return (
    <div className={`${cardClass} bg-white shadow-md flex flex-col gap-4`} role="alert">
      <h2 className="font-semibold text-lg">{heading}</h2>
      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Button
        onClick={start}
        className="self-start rounded-full bg-peach-500 hover:bg-peach-600 text-white"
        size="lg"
      >
        Try again
      </Button>
    </div>
  )
}
