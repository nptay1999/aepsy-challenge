import { useRef, useState, useEffect } from 'react'
import { useWavesurfer } from '@wavesurfer/react'
import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  audioBlob: Blob
  durationMs: number
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function AudioPlayer({ audioBlob, durationMs }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height: 48,
    interact: true,
    waveColor: '#f0766f',
    progressColor: '#d4524c',
    cursorColor: '#f0766f',
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
  })

  useEffect(() => {
    if (!wavesurfer) return
    wavesurfer.loadBlob(audioBlob).catch(() => setLoadError(true))
  }, [wavesurfer, audioBlob])

  useEffect(() => {
    if (!wavesurfer) return
    return wavesurfer.on('error', () => setLoadError(true))
  }, [wavesurfer])

  const totalSeconds = isReady && wavesurfer ? wavesurfer.getDuration() : durationMs / 1000

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums text-gray-500 shrink-0 w-16 text-right">
          {formatDuration(loadError ? 0 : currentTime * 1000)}
        </span>
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className={loadError ? 'hidden' : ''}
            aria-label="Audio waveform"
          />
          {loadError && (
            <div className="h-12 flex items-center" aria-label="Audio unavailable">
              <div className="w-full border-t-2 border-dashed border-gray-300" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium tabular-nums text-gray-500 shrink-0 w-16">
          {formatDuration(loadError ? durationMs : totalSeconds * 1000)}
        </span>
      </div>
      <div className="flex justify-center">
        <Button
          onClick={() => wavesurfer?.playPause()}
          disabled={loadError}
          size="icon"
          className="size-10 rounded-full bg-peach-500 hover:bg-peach-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </Button>
      </div>
    </div>
  )
}
