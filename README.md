# Aepsy Challenge — Frontend Take-Home

**Production:** https://aepsy-challenge.vercel.app/

A simplified onboarding flow for Aepsy: record a short voice note, confirm the
relevant mental-health topics, then browse matching psychologists.

---

## My approach and key decisions

**1. PRD-first, then code.** Before writing any feature I wrote a short PRD
per step under [prds/](prds/) — problem, solution, user stories, implementation
and testing decisions, out-of-scope. This surfaced edge cases (refresh mid-recording,
iOS MIME support, empty results, re-fetch on topic change) up front instead of
mid-implementation, and kept the code honest to a fixed scope.

**2. Layered recording hooks.** Recording logic is split in two:

- [use-audio-recorder.ts](src/hooks/use-audio-recorder.ts) — a thin, reusable
  wrapper around `MediaRecorder` (stream, chunks, blob, error).
- [use-voice-recorder.ts](src/hooks/use-voice-recorder.ts) — orchestration
  on top: an explicit state machine (`idle → requesting → recording → stopped | error`),
  2-minute auto-stop, runtime MIME detection (`audio/webm;codecs=opus` → `audio/webm` →
  `audio/mp4`) for Safari compatibility, and a best-effort `beforeunload` partial save.

The screen component ([voice-recording-step.tsx](src/features/onboarding/step-1-voice-recording/voice-recording-step.tsx))
only reads state and calls `start` / `stop` / `reset` — swapping the recording
engine would not touch the UI.

**3. Zustand + `persist(sessionStorage)` as a single source of truth.** One
store ([onboarding.store.ts](src/features/onboarding/onboarding.store.ts)) holds
the active step, the recording (base64 + mime + duration), and the selected
topics. Refresh, back-button, and cross-step navigation all work for free, and
there is no ad-hoc `sessionStorage` read/write scattered across steps.

**4. Feature-first folder layout.** Each step lives in its own folder under
[src/features/onboarding/](src/features/onboarding/) with its screen, sub-components,
and local UI — no cross-step imports except the shared store and the shared hook
for the Apollo search. A reviewer can open any step folder and read it top-to-bottom.

**5. Playwright E2E with Chromium + WebKit.** The interesting behavior
(mic-permission denial, MIME differences, `visibilitychange`, refresh recovery,
`Load More` pagination) is browser-level. Unit-testing `MediaRecorder` through
jsdom mocks would verify the mock, not the feature. See [src/\_\_tests\_\_/](src/__tests__/).

---

## Trade-offs and assumptions

- **No hook-level unit tests.** Only Playwright E2E. Faster feedback on real
  browsers, but hook-internal edge cases (auto-stop math, base64 round-trip,
  state-machine transitions) are not isolated.
- **Audio stored as base64 in `sessionStorage`.** Simple, self-contained, no
  backend — but ~33% size bloat and bounded by the browser's ~5MB limit. A real
  app would stream-upload to a backend instead.
- **`beforeunload` partial-save is best-effort.** Chunks are re-encoded on a
  debounced 2-second interval; an abrupt refresh may drop the last few hundred
  milliseconds. Documented as an assumption, not a guarantee.
- **`useAudioTranscriber` is kept as a mock.** Per the assignment, no real STT
  integration. The component renders whatever the hook returns, so swapping in a
  real API is a one-file change.
- **Apollo `fetchPolicy: 'network-only'`.** The psychologist search re-fetches
  on every topic change instead of relying on the Apollo cache. Gives up some
  cache benefit for predictable correctness when topics change.
- **Desktop Safari tested, iOS Safari not physically tested.** Runtime MIME
  detection should cover it, but I have not validated on a real iPhone.

---

## What I would improve with more time

1. **Real backend upload for audio** — resumable upload so a recording is
   durable even if the user closes the tab, and to remove the sessionStorage
   size ceiling.
2. **Unit tests for `useVoiceRecorder`** — state-machine transitions,
   auto-stop timing, MIME fallback, base64 round-trip. The hook is the
   highest-risk piece of logic and deserves isolated coverage.
3. **Psychologist detail view / booking flow.** Step 3 is read-only today;
   the natural next step is a profile page and a booking CTA.
4. **Filter / search inside the topic list.** 50 chips is a lot to scan on
   mobile — search, grouping, or progressive disclosure would help.
5. **i18n.** Mental-health onboarding has strong tone-of-voice requirements
   across languages; wiring in i18n early would be cheaper than later.
6. **Error telemetry (Sentry or similar).** Today errors only surface
   inline; production needs visibility into mic-permission failures, GraphQL
   errors, and `MediaRecorder` crashes across browsers.
7. **iOS Safari physical-device test pass.** MIME detection in theory vs.
   recording on a real iPhone are not the same thing.

---

## How to start this project

**Prerequisites:** Node 20+, pnpm 9+, a modern browser with microphone
access. No `.env` required — the GraphQL endpoint
(`https://api-dev.aepsy.com/graphql`) is configured in
[apollo-client.ts](src/services/apollo-client.ts).

```bash
pnpm install
pnpm dev                      # http://localhost:5173
pnpm build                    # production build
pnpm preview                  # serve the built bundle

pnpm exec playwright install  # first-time only
pnpm test                     # Playwright, chromium + webkit
pnpm test:ui                  # Playwright UI mode

pnpm lint
```

---

## Project structure

```
src/
  features/
    onboarding/
      step-1-voice-recording/    # record, playback, re-record
      step-2-select-relevant-topics/   # transcription + chip selection
      step-3-psychologists/      # GraphQL search + Load More
      onboarding.store.ts        # zustand store, persisted to sessionStorage
      index.tsx                  # stepper shell
    home/
  hooks/
    use-audio-recorder.ts        # low-level MediaRecorder wrapper
    use-voice-recorder.ts        # state machine + persistence + auto-stop
    use-audio-transcriber.tsx    # mock STT (provided)
  services/
    apollo-client.ts
    queries.ts                   # SEARCH_PROVIDERS
    hooks/use-psychologist-search.ts
  components/                    # shadcn/ui + layout primitives
  routes/                        # TanStack Router file-based routes
  __tests__/                     # Playwright specs

prds/                            # PRDs written before implementation
  voice-recording-prd.md
  topics-suggestion-prd.md
  psychologist-search-prd.md
```

---

## PRDs

Each step has a short PRD written before implementation. They capture the
problem, user stories, implementation decisions, and out-of-scope items:

- [prds/voice-recording-prd.md](prds/voice-recording-prd.md)
- [prds/topics-suggestion-prd.md](prds/topics-suggestion-prd.md)
- [prds/psychologist-search-prd.md](prds/psychologist-search-prd.md)
