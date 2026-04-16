import { useState, useEffect, useCallback, useRef, useReducer } from 'react'
import { useAudioRecorder } from './use-audio-recorder'

export type VoiceRecorderState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'stopped'
  | 'error'

type Phase = 'idle' | 'requesting' | 'active' | 'done' | 'failed'

interface RecorderState {
  phase: Phase
  durationMs: number
}

type RecorderAction =
  | { type: 'ERROR' }
  | { type: 'RECORDING_STARTED' }
  | { type: 'RECORDING_STOPPED'; durationMs: number }
  | { type: 'TICK'; durationMs: number }
  | { type: 'START' }
  | { type: 'RESET' }

function recorderReducer(state: RecorderState, action: RecorderAction): RecorderState {
  switch (action.type) {
    case 'ERROR':
      return { ...state, phase: 'failed' }
    case 'RECORDING_STARTED':
      return { ...state, phase: 'active' }
    case 'RECORDING_STOPPED':
      return { phase: 'done', durationMs: action.durationMs }
    case 'TICK':
      return { ...state, durationMs: action.durationMs }
    case 'START':
      return { phase: 'requesting', durationMs: 0 }
    case 'RESET':
      return { phase: 'idle', durationMs: 0 }
  }
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecorderState
  audioBlob: Blob | null
  audioUrl: string | null
  stream: MediaStream | null
  mimeType: string
  durationMs: number
  start: () => void
  stop: () => void
  reset: () => void
}

interface UseVoiceRecorderOptions {
  onMaxDurationReached?: () => void
}

// ---------------------------------------------------------------------------
// sessionStorage helpers
// ---------------------------------------------------------------------------

const SESSION_KEY = 'aepsy_voice_recording'

interface SessionPayload {
  audioBase64: string
  mimeType: string
  durationMs: number
  recordedAt: string
}

function parseSavedRecording(): {
  audioBase64: string
  mimeType: string
  durationMs: number
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: SessionPayload = JSON.parse(raw)
    if (!parsed.audioBase64 || !parsed.mimeType || typeof parsed.durationMs !== 'number') {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return {
      audioBase64: parsed.audioBase64,
      mimeType: parsed.mimeType,
      durationMs: parsed.durationMs,
    }
  } catch {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* no-op */
    }
    return null
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mimeType })
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function persistRecording(blob: Blob, mimeType: string, durationMs: number): Promise<void> {
  try {
    const audioBase64 = await blobToBase64(blob)
    const payload: SessionPayload = {
      audioBase64,
      mimeType,
      durationMs,
      recordedAt: new Date().toISOString(),
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* best-effort */
  }
}

// ---------------------------------------------------------------------------
// MIME detection
// ---------------------------------------------------------------------------

function detectMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ''
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [mimeType] = useState<string>(() => detectMimeType())
  const inner = useAudioRecorder({ mimeType, timeslice: 100 })

  // Parse sessionStorage exactly once (lazy init is guaranteed to run once).
  const [savedData] = useState(() => parseSavedRecording())

  const [{ phase, durationMs }, dispatch] = useReducer(
    recorderReducer,
    undefined,
    (): RecorderState => ({
      phase: savedData ? 'done' : 'idle',
      durationMs: savedData?.durationMs ?? 0,
    }),
  )

  // Decode the saved blob synchronously in the lazy initializer — no setState-in-effect needed.
  // restoredActive gates whether the restored data surfaces in the return value;
  // reset() flips it false, URL is revoked on unmount via the cleanup effect below.
  const [restoredData] = useState<{ blob: Blob; url: string } | null>(() => {
    if (!savedData) return null
    try {
      const blob = base64ToBlob(savedData.audioBase64, savedData.mimeType)
      return { blob, url: URL.createObjectURL(blob) }
    } catch {
      try {
        sessionStorage.removeItem(SESSION_KEY)
      } catch {
        /* no-op */
      }
      return null
    }
  })
  const [restoredActive, setRestoredActive] = useState(!!restoredData)

  // Revoke the restored blob URL when the hook unmounts.
  useEffect(() => {
    if (!restoredData) return
    return () => URL.revokeObjectURL(restoredData.url)
  }, [restoredData])

  const recordingStartMsRef = useRef(0)
  // Captures the final duration at stop time so the persist effect reads the right value.
  const finalDurationMsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const optionsRef = useRef(options)
  const stopRecordingRef = useRef(inner.stopRecording)

  useEffect(() => {
    optionsRef.current = options
  })
  useEffect(() => {
    stopRecordingRef.current = inner.stopRecording
  })

  // Shadow chunks + encoded ref for partial (beforeunload) saves.
  const shadowChunksRef = useRef<Blob[]>([])
  const lastPartialSaveRef = useRef<SessionPayload | null>(null)
  const encodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (autoStopRef.current !== null) {
      clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
  }, [])

  // Shadow-collect chunks via addEventListener so useAudioRecorder stays unmodified.
  // Every 2 s (debounced) the accumulated chunks are encoded into a ref so the
  // beforeunload handler can write to sessionStorage synchronously.
  useEffect(() => {
    const recorder = inner.mediaRecorder
    if (!recorder) return
    shadowChunksRef.current = []

    const handleData = (e: Event) => {
      const event = e as BlobEvent
      if (event.data.size > 0) shadowChunksRef.current.push(event.data)

      if (encodeTimerRef.current) clearTimeout(encodeTimerRef.current)
      encodeTimerRef.current = setTimeout(() => {
        encodeTimerRef.current = null
        const chunks = [...shadowChunksRef.current]
        if (!chunks.length) return
        const currentMime = recorder.mimeType || mimeType
        const blob = new Blob(chunks, { type: currentMime })
        const capturedDuration = Date.now() - recordingStartMsRef.current
        void blobToBase64(blob).then((audioBase64) => {
          lastPartialSaveRef.current = {
            audioBase64,
            mimeType: currentMime,
            durationMs: capturedDuration,
            recordedAt: new Date().toISOString(),
          }
        })
      }, 2000)
    }

    recorder.addEventListener('dataavailable', handleData)
    return () => {
      recorder.removeEventListener('dataavailable', handleData)
      if (encodeTimerRef.current) {
        clearTimeout(encodeTimerRef.current)
        encodeTimerRef.current = null
      }
    }
  }, [inner.mediaRecorder, mimeType])

  // Write the last encoded partial save to sessionStorage on page unload.
  // The handler is fully synchronous — it reads from the ref populated above.
  useEffect(() => {
    if (phase !== 'active') return

    const handleBeforeUnload = () => {
      if (lastPartialSaveRef.current) {
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(lastPartialSaveRef.current))
        } catch {
          /* best-effort */
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [phase])

  // Reconcile inner hook state changes → phase transitions.
  useEffect(() => {
    if (inner.error && phase !== 'failed') {
      clearTimer()
      dispatch({ type: 'ERROR' })
    } else if (inner.isRecording && phase === 'requesting') {
      recordingStartMsRef.current = Date.now()
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK', durationMs: Date.now() - recordingStartMsRef.current })
      }, 1000)
      autoStopRef.current = setTimeout(() => {
        stopRecordingRef.current()
        optionsRef.current.onMaxDurationReached?.()
      }, 120_000)
      dispatch({ type: 'RECORDING_STARTED' })
    } else if (!inner.isRecording && inner.audioBlob && phase === 'active') {
      clearTimer()
      const finalDurationMs = Date.now() - recordingStartMsRef.current
      finalDurationMsRef.current = finalDurationMs
      dispatch({ type: 'RECORDING_STOPPED', durationMs: finalDurationMs })
    }
  }, [inner.isRecording, inner.error, inner.audioBlob, phase, clearTimer])

  // Persist the complete recording to sessionStorage when recording stops normally.
  // Skipped on the restore path because inner.audioBlob is null there.
  useEffect(() => {
    if (phase !== 'done' || !inner.audioBlob) return
    void persistRecording(inner.audioBlob, mimeType, finalDurationMsRef.current)
  }, [phase, inner.audioBlob, mimeType])

  // Cleanup timers on unmount.
  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  const start = useCallback(() => {
    if (phase !== 'idle' && phase !== 'failed') return
    inner.clearRecording()
    dispatch({ type: 'START' })
    inner.startRecording()
  }, [phase, inner])

  const stop = useCallback(() => {
    if (phase !== 'active') return
    inner.stopRecording()
  }, [phase, inner])

  const reset = useCallback(() => {
    clearTimer()
    inner.clearRecording()
    dispatch({ type: 'RESET' })
    lastPartialSaveRef.current = null
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* no-op */
    }
    setRestoredActive(false)
  }, [inner, clearTimer])

  const state: VoiceRecorderState = (() => {
    switch (phase) {
      case 'idle':
        return 'idle'
      case 'requesting':
        return 'requesting-permission'
      case 'active':
        return 'recording'
      case 'done':
        return 'stopped'
      case 'failed':
        return 'error'
    }
  })()

  return {
    state,
    audioBlob: inner.audioBlob ?? (restoredActive ? (restoredData?.blob ?? null) : null),
    audioUrl: inner.audioUrl ?? (restoredActive ? (restoredData?.url ?? null) : null),
    stream: inner.stream,
    mimeType,
    durationMs,
    start,
    stop,
    reset,
  }
}
