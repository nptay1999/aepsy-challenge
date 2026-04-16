import { useRef, useEffect } from 'react'
import { useWavesurfer } from '@wavesurfer/react'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import { cn } from '@/lib/utils'

export interface LiveVisualizerProps {
  stream: MediaStream
  height?: number
  waveColor?: string
  barWidth?: number
  barGap?: number
  barRadius?: number
  className?: string
}

export function LiveVisualizer({
  stream,
  height = 80,
  waveColor = '#f0766f',
  barWidth = 2,
  barGap = 1,
  barRadius = 2,
  className,
}: LiveVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height,
    interact: false,
    waveColor,
    barWidth,
    barGap,
    barRadius,
    progressColor: 'transparent',
  })

  useEffect(() => {
    if (!wavesurfer) return

    let onDestroy: (() => void) | undefined

    try {
      const record = wavesurfer.registerPlugin(
        RecordPlugin.create({ scrollingWaveform: true, scrollingWaveformWindow: 8 }),
      )
      onDestroy = record.renderMicStream(stream).onDestroy
    } catch {
      // gracefully skip if Web Audio API is unavailable
    }

    return () => onDestroy?.()
  }, [wavesurfer, stream])

  return (
    <div
      className={cn('relative w-full', className)}
      style={{ height }}
      aria-label="Audio visualizer"
    >
      {/* Wavesurfer canvas — scrolling recorded bars */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Cursor line — always centered */}
      <div className="absolute inset-y-0 pointer-events-none right-0 w-0.5 bg-peach-500" />

      {/* Cursor dot — red circle at top of cursor */}
      <div className="absolute pointer-events-none rounded-full size-2 bg-peach-500 -top-1 -right-[3px]" />
    </div>
  )
}
