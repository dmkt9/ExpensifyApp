# Expensify App Root-Cause Investigation Context

This file is optimized for agents running `root-cause-find`, not for general onboarding.
Use it to decide where to look first, how to separate symptom from mechanism, and which app layers usually own a failure.

## Primary Mental Model

Most Expensify bugs are not single-file bugs. They usually come from one of these chains:

1. user action
2. route transition or local state change
3. optimistic Onyx write
4. queued API request or deferred side effect
5. server response / Pusher event / Onyx reconciliation
6. selector / hook / component render
7. visible symptom

When tracing a bug, avoid stopping at the screen that renders the symptom. The real cause is often earlier:

- a stale Onyx key
- an optimistic write not rolled back
- a route/history entry preserved too long
- a selector deriving the wrong value from otherwise valid data
- a sequential request ordering issue
- a server reconciliation path that overwrites a local assumption

## Architecture Priorities For Root Cause

### 1. Onyx is the main client-side source of truth

Relevant anchors:

- `src/ONYXKEYS.ts`
- `src/hooks/useOnyx.ts`
- `src/selectors/`
- `src/types/onyx/`
- `src/libs/migrateOnyx.ts`

Investigation implications:

- If the UI is wrong, confirm whether the wrong value already exists in Onyx before blaming rendering code.
- Many regressions are "correct component, wrong data" rather than "wrong component logic".
- Onyx writes are asynchronous. A symptom that looks like a race can be a read that happens before all batched updates settle.
- Collection keys and NVP keys often hide the real dependency chain. Check dynamic keys carefully.

### 2. Actions usually own the causal transition

Relevant anchors:

- `src/libs/actions/Report/`
- `src/libs/actions/IOU/`
- `src/libs/actions/Policy/`
- `src/libs/actions/Session/`
- `src/libs/actions/Search.ts`

Investigation implications:

- Actions are often the layer that prepares optimistic data, fires API commands, and defines rollback/success merges.
- If a bug appears "after tapping X", look at the action triggered by that tap before reading deep UI code.
- Missing or malformed optimistic/failure/success Onyx payloads are common root causes.

### 3. Navigation bugs often involve state persistence, not just wrong destination code

Relevant anchors:

- `src/libs/Navigation/Navigation.ts`
- `src/libs/Navigation/navigationRef.ts`
- `src/ROUTES.ts`
- `src/SCREENS.ts`
- `src/NAVIGATORS.ts`
- `src/DeepLinkHandler.tsx`

Investigation implications:

- The visible symptom may occur on back navigation, modal dismissal, deep linking, or split navigator restoration even if the original action looked correct.
- History, nested navigator state, and screen params can preserve stale context.
- On mobile, device back behavior can expose latent state left behind by an earlier transition.

### 4. Network reconciliation is a distinct failure stage

Relevant anchors:

- `src/libs/API/index.ts`
- `src/libs/Network/MainQueue.ts`
- `src/libs/Network/SequentialQueue.ts`
- `src/libs/Network/NetworkStore.ts`
- `src/libs/HttpUtils.ts`
- `src/libs/Pusher/`
- `src/libs/PusherConnectionManager.ts`

Investigation implications:

- Write requests typically apply optimistic Onyx data first, then enter the sequential queue.
- Final UI state may be shaped by:
  - optimistic data
  - success data
  - failure data
  - Pusher updates
  - replayed persisted requests after reconnect
- A bug that appears "only after reconnect" or "only after some delay" is often a reconciliation bug, not an input bug.

## Symptom-To-Hotspot Map

### Wrong screen, bad back behavior, stale modal, broken deep link

Start with:

- `src/libs/Navigation/Navigation.ts`
- `src/ROUTES.ts`
- `src/SCREENS.ts`
- page-level component that initiated navigation
- any helper under `src/libs/Navigation/`

Common mechanisms:

- stale route params
- split navigator state preserved incorrectly
- dismiss/replace/linkTo sequence happening in the wrong order
- deep-link parsing or route reconstruction mismatch

### UI shows stale or unexpected data

Start with:

- relevant `useOnyx(...)` calls
- `src/selectors/`
- action that last touched the data
- matching `src/types/onyx/` type

Common mechanisms:

- optimistic write not reverted
- selector assumptions no longer matching new data shape
- derived state reading from the wrong collection key
- partial merge leaving stale fields behind

### Action succeeds visually, then later flips or disappears

Start with:

- action file under `src/libs/actions/`
- `src/libs/API/index.ts`
- `src/libs/Network/SequentialQueue.ts`
- any server-driven Onyx updates or Pusher handling

Common mechanisms:

- optimistic state applied correctly, but success/failure reconciliation is wrong
- duplicate or reordered queued requests
- server response overwriting local assumptions
- Pusher exclusion or replay behavior masking the expected update path

### Bug only happens offline, after reconnect, or with poor network

Start with:

- `src/libs/API/index.ts`
- `src/libs/Network/MainQueue.ts`
- `src/libs/Network/SequentialQueue.ts`
- `ONYXKEYS.PERSISTED_REQUESTS`
- `ONYXKEYS.NETWORK`

Common mechanisms:

- request persisted and replayed later with stale assumptions
- optimistic update visible while offline, then invalidated on reconnect
- multiple queued writes reconciling in unexpected order
- online/offline boundary exposing missing rollback behavior

### Report / chat / expense timeline issues

Start with:

- `src/libs/actions/Report/`
- `src/libs/ReportUtils.ts`
- `src/libs/ReportActionsUtils.ts`
- `src/selectors/Report.ts`
- `src/selectors/ReportAction.ts`
- `src/pages/inbox/ReportScreen.tsx`

Common mechanisms:

- report metadata and report actions disagree
- parent/child report linkage is stale
- action ordering assumptions break after pagination or incremental loading
- unread/read or pending state is derived from stale Onyx collections

### Money request / transaction / expense flow issues

Start with:

- `src/libs/actions/IOU/`
- `src/libs/IOUUtils.ts`
- `src/selectors/TransactionDraft.ts`
- `src/types/onyx/Transaction.ts`
- `src/types/onyx/Report.ts`
- `src/pages/iou/request/step/`

Common mechanisms:

- draft transaction state diverges from committed transaction state
- route step depends on data that exists only optimistically
- receipt/category/tag/policy dependencies resolve in different order than the UI expects
- policy rules or violations update after the flow already rendered

### Workspace / policy configuration bugs

Start with:

- `src/libs/actions/Policy/`
- `src/selectors/Policy.ts`
- `src/types/onyx/Policy.ts`
- relevant `src/pages/workspace/` page

Common mechanisms:

- policy collections merge partially and leave stale config
- feature enable/disable requests conflict or deduplicate unexpectedly
- dependent fields are not cleared when a parent setting changes

### Auth / account / session issues

Start with:

- `src/libs/actions/Session/`
- `src/selectors/Session.ts`
- `ONYXKEYS.SESSION`
- `ONYXKEYS.ACCOUNT`
- auth-related navigation guards

Common mechanisms:

- stale session/account state during reauthentication
- guard logic reading one key while another key is still updating
- HybridApp or deep-link entry path bypassing an expected initialization step

## Important Data Shapes And State Zones

These Onyx regions are high-value when building a causal chain:

- `SESSION`, `ACCOUNT`, `CREDENTIALS`: auth and identity issues
- `NETWORK`, `PERSISTED_REQUESTS`, `PERSISTED_ONGOING_REQUESTS`: offline/retry/replay behavior
- `PERSONAL_DETAILS_LIST`, `PERSONAL_DETAILS_METADATA`: user/profile rendering issues
- `REPORT*` collections: chat, report shell, report metadata, report actions, report name-value pairs
- `TRANSACTION*` collections and drafts: expense creation/editing issues
- `POLICY*` collections: workspace config, tags, categories, rules, integrations
- `NVP_*` keys: feature flags, local preferences, flow progress, dismissals, sticky UI state
- `MODAL`, fullscreen and visibility keys: overlays and flow interruption issues

## Root-Cause Heuristics Specific To This Repo

### Distinguish trigger from exposure

In Expensify, the user-visible step is often not the step that created the bad state.

Examples:

- A modal close exposes stale navigation state created by an earlier push/replace.
- A final confirmation screen exposes draft data corruption introduced two steps earlier.
- Reconnect exposes a reconciliation bug caused by optimistic data written while offline.

### Prefer action-level evidence over component-level intuition

If a button tap leads to a bug, gather these before concluding:

- which action ran
- which Onyx keys it wrote optimistically
- which API command it fired
- which success/failure data it prepared
- whether any later navigation depended on optimistic-only state

### Treat selectors and helper utilities as causal layers

Many regressions are caused by a selector or utility encoding an outdated invariant.
If raw Onyx looks correct but the screen is wrong, inspect:

- `src/selectors/`
- `src/libs/*Utils.ts`
- hook-level adapters between Onyx and rendering

### Be careful with partial merges

Onyx merges can preserve stale fields if callers assume replacement semantics.
When actual behavior looks like "old value survived unexpectedly", check whether the write path merged a partial object instead of clearing obsolete fields.

### Be careful with queued writes

Expensify uses queued and persisted network writes. If two user actions are close together, the bug may depend on queue order rather than view logic.

### Do not over-attribute to React rendering

If a symptom persists across rerenders or after navigation, it is often a state or reconciliation issue, not a render glitch.

## Suggested Investigation Order

For most bugs, read in this order:

1. the bug report's repro steps, expected result, and actual result
2. the page/component where the symptom appears
3. the action triggered by the repro step that first activates the bad path
4. the Onyx keys read and written around that action
5. the navigation transition, if any
6. the API request and reconciliation path, if any
7. selectors/helpers that transform the stored data into UI state

## Evidence Standards For Agent Reports

Strong evidence in this repo usually looks like:

- a direct repro step mapping to a named action
- a specific Onyx key whose value becomes wrong or stale
- a route/state transition that preserves bad params or history
- an optimistic write / success write / failure write mismatch
- a selector or helper whose assumptions contradict the stored data shape

Weak evidence usually looks like:

- "the screen probably rerendered incorrectly"
- "this seems like a race condition" without identifying the competing writes or transitions
- "navigation is broken" without naming the stale state or route entry
- "server data is wrong" without showing the client write/reconcile path

## Investigation Guardrails

- Do not confuse the first repro step with the triggering repro step.
- Do not stop at the component where the symptom is rendered.
- Do not claim a root cause until you identify the intermediate state change between trigger and symptom.
- Do not assume online-only behavior; offline-first architecture changes many causal chains.
- Do not ignore NVP keys. Many UI-state regressions live there.
- Do not assume native-only issues originate in native code; many are shared-state or navigation bugs exposed only on mobile.
