# Step 2: Select Relevant Topics — PRD

## Problem Statement

After recording their voice message in step 1, users have no way to communicate which mental health topics are relevant to their situation. Without this signal, the system cannot meaningfully match them with the right psychologist. Users need a fast, low-friction way to confirm or refine the topics detected from their recording before proceeding to psychologist matching.

## Solution

When the user enters step 2, the recorded audio is immediately processed by the transcription service, which returns a list of relevant mental health topics. The user sees all available topics rendered as toggleable chips, can select one or more that apply to them, and proceeds to step 3 with their selection persisted.

## User Stories

1. As a user entering step 2, I want transcription to start automatically so that I don't have to trigger it manually.
2. As a user waiting for transcription, I want to see skeleton chip placeholders so that I understand topics are being generated from my recording.
3. As a user, I want to see all available mental health topics displayed as chips so that I can quickly scan and select what applies to me.
4. As a user, I want chips to be visually toggled (selected vs unselected) so that I can clearly see which topics I've chosen.
5. As a user, I want the "Continue" button to be disabled until I select at least one topic so that I don't accidentally skip this step.
6. As a user, I want to select as many topics as I need with no upper limit so that I can accurately represent the full scope of my concerns.
7. As a user, I want to deselect a topic I previously selected so that I can correct mistakes.
8. As a user who experiences a transcription error, I want to see a clear error state with a "Try again" button so that I can retry without going back to step 1.
9. As a user whose transcription repeatedly fails, I want a "Skip and browse all topics" fallback so that I can still complete the onboarding.
10. As a user who accidentally refreshes the page on step 2, I want my topic selections to be restored from session so that I don't lose my progress.
11. As a user, I want the "Others" topic to behave like any other chip so that I can select it without additional friction.
12. As a user proceeding to step 3, I want my selected topics (value codes and labels) to be available so that psychologist matching can use them.
13. As a user on a mobile device, I want the chip grid to wrap responsively so that all topics are accessible regardless of screen width.
14. As a user, I want selected chips to use a distinct accent color (peach-500) so that my selections are immediately visible at a glance.

## Implementation Decisions

- **Transcription trigger**: `processAudio` is called on step 2 mount, using the audio blob retrieved from sessionStorage (`aepsy_voice_recording`).
- **Topic display**: All topics returned by `useAudioTranscriber` are rendered as toggleable chips in a wrapping flex/grid layout. No filtering or pre-selection is applied — the mock returns the full list and the real API is expected to do the same.
- **Chip component**: A new togglable chip component with two visual states — unselected (neutral/outlined) and selected (peach-500 filled). Follows the existing shadcn/ui + Tailwind CSS v4 styling conventions.
- **Selection state**: Managed locally with `useState<DisorderOption[]>` tracking the array of selected options.
- **Continue button gate**: Disabled when `selectedTopics.length === 0` or while transcription is loading/errored. Same pattern as the 5-second gate in step 1.
- **Error handling**: On transcription failure, render an error state with a "Try again" button that re-invokes `processAudio`. No automatic fallback to full list on first failure.
- **Loading skeleton**: Render ~8–10 chip-shaped skeletons using the existing `Skeleton` component during `isLoading === true`. Layout matches the chip grid to prevent layout shift.
- **Session persistence**: On every selection change, write selected topics to sessionStorage under key `aepsy_selected_topics` as a JSON-serialised `DisorderOption[]`. On mount (after transcription completes), rehydrate selections from sessionStorage if present.
- **Data contract to step 3**: Selected topics are passed as `DisorderOption[]` — both `value` (for psychologist matching logic) and `label` (for display in step 3). This array is also available via sessionStorage for reload recovery.
- **"Others" topic**: `{ value: 'U_DIS_OTHER', label: 'Others' }` is treated as a standard chip with no special behaviour or free-text input.
- **Step navigation**: Uses the existing `Stepper` component in `src/features/onboarding/index.tsx`. Step 2 calls the parent's `onNext` callback with the selected topics array.

## Testing Decisions

A good test for this feature verifies **external, observable behaviour** — what the user sees and can do — not internal state or implementation details like which hook is called or how sessionStorage is written.

**Modules to test:**

- Step 2 component (`src/features/onboarding/step-2-select-relevant-topics/`)

**Test scenarios (Playwright E2E):**

- Skeleton chips are shown immediately on entering step 2 while transcription is pending.
- After transcription resolves, all topic chips are rendered and skeletons are gone.
- "Continue" button is disabled when no topics are selected.
- Clicking a chip selects it (visual change); clicking again deselects it.
- "Continue" button enables after at least one chip is selected.
- "Others" chip is selectable like any other chip.
- On transcription error, an error message and "Try again" button are shown.
- Clicking "Try again" re-triggers transcription and shows skeletons again.
- Refreshing the page on step 2 restores previously selected topics from sessionStorage.
- Proceeding to step 3 passes the correct selected `DisorderOption[]` values.

**Prior art**: Follow the mocking pattern in `src/__tests__/onboarding.spec.ts` — mock the transcriber at the boundary (replace `useAudioTranscriber` response) rather than intercepting network calls.

## Out of Scope

- Free-text input when "Others" is selected.
- User-defined custom topics not in the predefined list.
- Search or filter functionality within the topic list.
- Maximum selection limit.
- Grouping or categorising topics (e.g., "personal" vs "family" concerns).
- Real transcription API integration (the hook remains mocked).
- Any UI or logic for step 3 (psychologist matching).

## Further Notes

- The `useAudioTranscriber` mock always returns the full list of 50 topics regardless of audio content. The real API is expected to return a subset relevant to the recording — the PRD is written to accommodate both behaviours since the component renders whatever the hook returns.
- Session persistence keys: `aepsy_voice_recording` (step 1, existing) and `aepsy_selected_topics` (step 2, new). Both follow the same Base64/JSON pattern established in step 1.
- The `DisorderOption` type and `useAudioTranscriber` hook already exist in `src/hooks/use-audio-transcriber.tsx` — step 2 consumes them directly without modification.
