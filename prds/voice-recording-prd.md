# PRD: Step 1 — Voice Recording

## Problem Statement

Alex is seeking mental health support on Aepsy. Instead of being greeted by a long intake form, he needs a simple, emotionally safe way to express how he feels. The voice recording step is the entry point of the onboarding flow — it captures Alex's self-described emotional state, which is then used to suggest relevant topics and match him with suitable psychologists.

The recording experience must feel stable, predictable, and trustworthy — even in less-than-ideal conditions like a denied microphone, an accidental page refresh, or a tab switch mid-recording.

---

## Solution

A single-screen voice recording interface that guides Alex through recording a short voice note. The screen transitions between three clear states: **ready to record**, **recording**, and **playback/review**. Alex can re-record freely, and his recording is preserved across page refreshes. Once a valid recording exists (≥5 seconds), he can proceed to Step 2.

---

## User Stories

1. As a user, I want to see a clear "Start Recording" prompt when I land on the step, so that I know exactly what action to take.
2. As a user, I want to start recording by tapping/clicking a single button, so that the experience feels simple and low-friction.
3. As a user, I want to see a live audio level visualization while recording, so that I can confirm the microphone is actively picking up my voice.
4. As a user, I want to see a running timer while recording, so that I know how long I have been speaking.
5. As a user, I want the recording to automatically stop after 2 minutes, so that I am not left hanging with no feedback if I forget to stop.
6. As a user, I want to see a notice when the 2-minute maximum is reached, so that I understand why recording stopped.
7. As a user, I want to stop recording manually at any time by pressing a stop button, so that I have control over when I'm done.
8. As a user, I want to be prevented from proceeding if my recording is shorter than 5 seconds, so that I don't accidentally submit an empty or trivially short clip.
9. As a user, I want to play back my recording after I stop, so that I can review what I said before proceeding.
10. As a user, I want a seek bar (scrubber) in the playback controls, so that I can jump to any part of the recording to verify specific sections.
11. As a user, I want to see the current playback position and total duration during playback, so that I can orient myself within the clip.
12. As a user, I want to re-record freely without a confirmation dialog, so that I can start fresh without friction if I'm not happy with my recording.
13. As a user, I want my recording to be preserved if I accidentally refresh the page, so that I don't have to start over.
14. As a user, I want my partial recording to be preserved if I navigate away and come back, so that I can decide whether to keep it or re-record.
15. As a user, I want the recording to continue in the background if I switch tabs, so that a momentary distraction doesn't break my recording session.
16. As a user, I want to see an inline error message if microphone permission is denied, so that I understand what went wrong.
17. As a user, I want the error message to include clear instructions for re-enabling microphone access in my browser, so that I can fix the issue myself without guessing.
18. As a user, I want the "Continue" button to only become active once I have a valid recording (≥5 seconds), so that I can't accidentally proceed with no input.
19. As a user, I want the interface to work on both desktop and mobile browsers (including Safari on iOS), so that I am not blocked by my device choice.
20. As a user, I want the recording experience to feel consistent regardless of browser, so that the format differences between Chrome and Safari are invisible to me.

---

## Implementation Decisions

### Module Breakdown

**1. Recording Engine (`useVoiceRecorder` hook)**

Encapsulates all recording logic, completely decoupled from the UI. Responsibilities:

- Request microphone permission via `getUserMedia`
- Manage `MediaRecorder` lifecycle (start, stop, pause on visibility if needed)
- Detect supported audio format at runtime: prefer `audio/webm;codecs=opus`, fall back to `audio/mp4`
- Collect audio chunks and assemble the final `Blob` on stop
- Expose recording state: `idle | requesting-permission | recording | stopped | error`
- Enforce the 2-minute maximum via an internal timer, emitting an `onMaxDurationReached` callback
- Persist the final audio `Blob` to `sessionStorage` (base64-encoded) on stop
- Restore a prior recording from `sessionStorage` on mount
- Handle partial recordings: on `beforeunload` while recording is active, flush collected chunks to `sessionStorage`
- Continue recording when the tab is hidden (do not pause on `visibilitychange`)

**2. Audio Visualizer (recording state)**

Uses `wavesurfer.js` with `@wavesurfer/react` in microphone input mode to render a live waveform/level indicator while recording is active. Driven by the live `MediaStream` from the recording engine. Mounted only during the `recording` state.

**3. Audio Player (playback state)**

Uses `wavesurfer.js` with `@wavesurfer/react` to render:

- Waveform seek bar (scrubber)
- Play/pause control
- Current position / total duration timer

Mounted only during the `stopped` state, initialized with the recorded audio `Blob` URL.

**4. Recording Timer**

A simple display component that formats elapsed seconds into `M:SS`. Driven by a `useInterval` tick while recording state is active. Counts up from 0:00, stops and holds at 2:00 on auto-stop.

**5. Permission Error UI**

An inline component rendered when recording state is `error` (permission denied or device not found). Displays:

- A descriptive error message ("Microphone access was denied")
- Browser-specific instructions for re-enabling mic access
- A "Try again" button that re-triggers permission request

**6. Voice Recording Screen (`VoiceRecordingStep`)**

The top-level UI component. Composes the modules above and transitions between three visual states:

- **Idle:** Prompt text + single "Start Recording" CTA
- **Recording:** Live visualizer + timer + "Stop" button
- **Stopped:** Audio player + "Re-record" button + "Continue" CTA (enabled only if duration ≥5s)

### State Machine

The recording flow follows a strict state machine:

```
idle → requesting-permission → recording → stopped
                ↓
             error (permission denied)
recording → stopped (manual stop or 2-min auto-stop)
stopped → idle (re-record)
```

### sessionStorage Schema

```
key: "aepsy_voice_recording"
value: {
  audioBase64: string,   // base64-encoded audio blob
  mimeType: string,      // e.g. "audio/webm;codecs=opus"
  durationMs: number,    // recorded duration in milliseconds
  recordedAt: string     // ISO timestamp
}
```

### Audio Format Detection

At recording start, use `MediaRecorder.isTypeSupported()` in priority order:

1. `audio/webm;codecs=opus`
2. `audio/webm`
3. `audio/mp4`
4. `""` (browser default)

The selected MIME type is stored alongside the blob so playback uses the correct format.

### Partial Recording on Page Unload

Register a `beforeunload` event listener while recording is active. On fire, call `mediaRecorder.stop()` synchronously and flush collected chunks to `sessionStorage`. This is best-effort — browsers may not guarantee the full flush on unload, but it covers the common refresh/back-button case.

---

## Testing Decisions

### What makes a good test

Tests should verify **observable behavior from the outside** — what state is exposed, what side effects occur, what the user sees — not internal implementation details like which internal variables were set or which private methods were called.

### Modules to test

**`useVoiceRecorder` hook (unit + integration)**

- Transitions through the correct states on start/stop
- Calls `getUserMedia` on record initiation
- Moves to `error` state when permission is denied
- Auto-stops and calls `onMaxDurationReached` after 2 minutes (with faked timers)
- Persists blob to `sessionStorage` on stop
- Restores prior recording from `sessionStorage` on mount
- Selects the correct MIME type based on `isTypeSupported` mock responses
- Continues recording when `visibilitychange` fires (tab switch)
- Saves partial recording to `sessionStorage` on `beforeunload` while recording

**`VoiceRecordingStep` component (integration)**

- Shows "Start Recording" CTA in idle state
- Transitions to recording UI after CTA click (mic granted)
- Shows inline permission error when mic is denied
- Shows playback UI after stop
- "Continue" button is disabled when recording duration <5s
- "Continue" button is enabled when recording duration ≥5s
- "Re-record" button resets to idle state immediately

### Prior art / test patterns

Follow the existing test conventions in the codebase. Mock `navigator.mediaDevices.getUserMedia` and `MediaRecorder` via Playwright's `page.addInitScript()` or `browserContext.addInitScript()` to inject fakes before page load. Use Playwright for all component and integration tests. Use `page.clock.install()` (Playwright's built-in clock API) for duration/auto-stop tests instead of fake timers.

---

## Out of Scope

- Uploading the audio to a server or backend API — the recording is kept in `sessionStorage` only
- Speech-to-text transcription at this step (that is handled by `useAudioTranscriber` in Step 2)
- Noise cancellation or audio post-processing
- Recording pause/resume (only start and stop)
- Multiple recordings or a recording history
- Accessibility beyond standard semantic HTML and ARIA labels
- Offline / PWA support

---

## Further Notes

- `wavesurfer.js` with `@wavesurfer/react` is used for both the live recording visualizer and the playback seek bar, keeping the audio visualization dependency consolidated in one library.
- Mobile Safari does not support `audio/webm` — the runtime MIME type detection is essential for iOS compatibility.
- The `sessionStorage` approach keeps this step self-contained with no backend dependency, which aligns with the assignment's scope.
- The 5-second minimum is enforced in the UI layer (CTA disabled) not the recording engine, keeping the engine reusable without UX assumptions baked in.
