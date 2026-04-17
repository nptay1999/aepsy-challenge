# PRD: Step 3 — Psychologist Search

## Problem Statement

Alex has recorded a voice note describing how he feels and selected the mental health topics most relevant to his situation. Now he needs to find the right professional to help him. The psychologist search step is the final stage of the onboarding flow — it translates his topic selections into a ranked, browsable list of matching psychologists, so he can make an informed choice and proceed with confidence.

The experience must feel immediate and personal — results should load automatically based on his prior selections, be easy to scan on both mobile and desktop, and handle failure or empty results gracefully without leaving him stranded.

---

## Solution

A single-screen psychologist list that auto-fetches on mount using the topics saved from Step 2. Results are displayed as cards matching the provided sample UI design, with a "Load More" button for pagination. Alex can go back to Step 2 to adjust his topic selections at any time. The screen handles loading (skeleton cards), empty results, and API errors with clear inline feedback and recovery actions.

---

## User Stories

1. As a user, I want the psychologist list to load automatically when I reach Step 3, so that I don't have to press a separate "Search" button after already selecting my topics.
2. As a user, I want to see skeleton placeholder cards while results are loading, so that I have visual feedback that something is happening without a jarring blank screen.
3. As a user, I want to see a psychologist's full name prominently on their card, so that I can identify them quickly while browsing.
4. As a user, I want to see a psychologist's profile photo on their card, so that I can form a sense of who I might be working with.
5. As a user, I want to see a psychologist's title (e.g. "Psychotherapist") on their card, so that I understand their professional role at a glance.
6. As a user, I want to see how many years of experience a psychologist has on their card, so that I can gauge their level of expertise.
7. As a user, I want to see relevant tag-based attributes (e.g. "Flexible offerings") on a psychologist's card when the data supports it, so that I can quickly identify psychologists who match additional preferences.
8. As a user, I want the results to be ranked and ordered by relevance to my selected topics, so that the most suitable psychologists appear first.
9. As a user, I want to see 6 psychologist cards on initial load, so that I have a manageable number of results to scan without being overwhelmed.
10. As a user, I want a "Load More" button to appear when there are more results available, so that I can progressively explore a larger pool of psychologists.
11. As a user, I want the "Load More" button to disappear when all results have been loaded, so that I know I've seen the full list.
12. As a user, I want the newly loaded cards to append below the existing cards (not replace them), so that I can continue scanning from where I left off.
13. As a user, I want a loading indicator on the "Load More" button while additional results are fetching, so that I know the action was registered.
14. As a user, I want to see an empty state message if no psychologists match my selected topics, so that I understand why the list is empty rather than being confused.
15. As a user, I want the empty state to include a "Back to Topics" button, so that I can return to Step 2 and adjust my selections without having to use the stepper header.
16. As a user, I want to see an inline error message if the GraphQL request fails, so that I understand something went wrong.
17. As a user, I want a "Try again" retry button on the error state, so that I can recover from a transient network failure without refreshing the page.
18. As a user, I want a "Back" button in the Step 3 content area, so that I can navigate back to Step 2 to refine my topic selections at any time.
19. As a user, I want my topic selections to be preserved when I navigate back to Step 2, so that I don't have to re-select everything just to tweak one topic.
20. As a user, I want the psychologist list to re-fetch automatically if my topic selections change and I return to Step 3, so that results always reflect my current selections.
21. As a user, I want the psychologist list experience to work well on both mobile and desktop, so that I am not limited by my device.
22. As a user, I want the card layout to adapt cleanly to mobile screen widths, so that I can comfortably scan psychologist profiles on a small screen.
23. As a user, I want psychologist cards to be accessible via keyboard navigation, so that I can browse the list without a mouse.
24. As a user, I want avatar images to have descriptive alt text, so that the cards are accessible to screen reader users.

---

## Implementation Decisions

### Module Breakdown

**1. GraphQL Client Setup (Apollo Client)**

A single Apollo Client instance configured with the endpoint `https://api-dev.aepsy.com/graphql`. The client is provided at the app root via `ApolloProvider`. No authentication headers are required based on the provided query file.

**2. Psychologist Search Hook (`usePsychologistSearch`)**

Encapsulates all data-fetching logic, completely decoupled from the UI. Responsibilities:

- Read selected topic `value` strings from `sessionStorage` on mount
- Execute the `SEARCH_PROVIDERS` GraphQL query via Apollo's `useQuery` or `useLazyQuery`
- Manage pagination state: current `pageNum`, accumulated `providers` list, `canLoadMore` flag
- Expose a `loadMore` function that increments `pageNum` and merges new results into the existing list
- Expose state: `providers`, `isLoading`, `isLoadingMore`, `canLoadMore`, `error`
- Re-fetch automatically when the topics in sessionStorage change (compared on mount)

**3. Psychologist Card (`PsychologistCard`)**

A pure presentational component matching the provided sample UI design. Renders:

- Circular avatar image (with fallback for missing avatars)
- Full name (`firstName + lastName`)
- Years of experience (e.g. "4 years of experience")
- Provider title (e.g. "Psychotherapist")
- Footer row: rendered only when at least one relevant tag is present (e.g. "Flexible offerings" derived from `providerTagInfo.tags`)

**4. Skeleton Card (`PsychologistCardSkeleton`)**

A placeholder component with the same dimensions and layout as `PsychologistCard`, using animated grey blocks in place of real content. Six skeleton cards are shown during the initial load.

**5. Psychologist List (`PsychologistList`)**

Composes the above modules and manages the three display states:

- **Loading:** 6 `PsychologistCardSkeleton` components
- **Empty:** Inline message + "Back to Topics" button (navigates to Step 2)
- **Error:** Inline error message + "Try again" retry button
- **Success:** Grid of `PsychologistCard` components + conditional "Load More" button

**6. Step 3 Screen (`Step3Psychologists`)**

The top-level component for Step 3. Renders the "Back" button and the `PsychologistList`. Receives an `onBack` callback from the Onboarding stepper to navigate back to Step 2.

### State Sharing: sessionStorage

Selected topics are persisted to `sessionStorage` by Step 2 when the user proceeds to Step 3. Step 3 reads from `sessionStorage` on mount.

**sessionStorage schema (Step 2 output):**

```
key: "aepsy_selected_topics"
value: string[]  // array of disorder value strings, e.g. ["U_DIS_DEPRESSION", "U_DIS_STRESS"]
```

### GraphQL Query

Using the provided `SEARCH_PROVIDERS` query:

- `$rawDisorders`: populated from `sessionStorage` selected topics
- `$pageSize`: fixed at `6`
- `$pageNum`: starts at `1`, incremented on each "Load More" click
- Pagination is offset-based: new pages fetch fresh results which are appended to the existing list in local state
- `canLoadMore` from the response drives the "Load More" button visibility

### Tag-to-Badge Derivation

The footer row on `PsychologistCard` is rendered only when `providerTagInfo.tags` contains at least one entry. The specific badge label is derived from the tag's `text` field. If the tags array is empty or absent, the footer row is omitted entirely.

### Pagination Strategy

- Initial fetch: `pageNum: 1, pageSize: 6`
- "Load More": increment `pageNum` by 1, fetch, append results to existing list
- "Load More" button shows a spinner while `isLoadingMore` is true
- Button disappears when `canLoadMore` is `false`

### Onboarding Integration

`onboarding/index.tsx` passes an `onBack` callback to `Step3Psychologists`, which sets `activeStep` back to `2`. The existing Stepper header navigation continues to work as-is.

---

## Testing Decisions

### What makes a good test

Tests should verify **observable behavior from the outside** — what the user sees, what data is displayed, what state transitions occur on user actions — not internal Apollo cache state, hook internals, or component implementation details.

### Modules to test

**`usePsychologistSearch` hook (integration)**

- Reads topic values from `sessionStorage` and passes them as `rawDisorders`
- Exposes the correct `providers` list after a successful query
- Exposes `isLoading: true` before the query resolves
- Exposes `error` when the query fails
- `loadMore` increments `pageNum` and appends new providers to the existing list
- `canLoadMore` is `false` when the API returns `canLoadMore: false`

**`Step3Psychologists` component (integration / E2E)**

- Shows 6 skeleton cards while the initial query is in-flight
- Renders a psychologist card for each result with correct name, title, years of experience
- Renders tag-derived footer row when tags are present; omits it when tags are empty
- Shows empty state message and "Back to Topics" button when query returns zero results
- Shows error message and "Try again" button when the query fails
- "Try again" triggers a re-fetch
- "Load More" button appears when `canLoadMore` is true
- "Load More" button is absent when `canLoadMore` is false
- Clicking "Load More" appends new cards below existing ones
- "Back" button calls `onBack` and navigates to Step 2

### Prior art / test patterns

Follow the Playwright E2E patterns established for Step 1. Mock the Apollo Client or use `MockedProvider` from `@apollo/client/testing` to inject controlled GraphQL responses. Use `page.addInitScript()` to seed `sessionStorage` with topic values before the component mounts.

---

## Out of Scope

- Booking, scheduling, or contacting a psychologist — Step 3 is a read-only list
- Psychologist detail pages or expanded profile modals
- Filtering or sorting results within Step 3 (topics are set in Step 2)
- Authentication or user accounts
- Real audio transcription (handled by the mock `useAudioTranscriber` in Step 2)
- Saving or bookmarking psychologists
- Accessibility beyond semantic HTML, ARIA labels on images, and keyboard navigation of the list

---

## Further Notes

- The `SEARCH_PROVIDERS` query wraps pagination inside `searchProviders(input: {...}).providers(pageSize, pageNum)` — the outer `searchProviders` call returns a search session `id`, and pagination is nested within it. Apollo Client should treat each unique `rawDisorders` combination as a separate cache entry.
- The `providerTitle` field (e.g. "Psychotherapist", "Psychologist") comes from `profile.providerInfo.providerTitle` and maps directly to the title line in the sample card design.
- `yearExperience` is a number — format it as `"N years of experience"` in the card component.
- The sample card design shows "500+ sessions" which has no corresponding API field — this field is intentionally omitted from the implementation.
- Avatar images are served as URLs from `userInfo.avatar`; implement a fallback (initials or generic silhouette) for cases where the URL is missing or fails to load.
