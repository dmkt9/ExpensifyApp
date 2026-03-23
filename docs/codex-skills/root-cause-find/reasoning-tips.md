# Root Cause Find Reasoning Tips

Use this file for judgment-heavy cases where the main skill rules are clear but the evidence is not.

## Triggering Repro Step

Choose the step that first activates the failure path, not just the first step in the bug report.

- Setup steps make the bug possible, but the triggering step is the one that causes the app to enter the bad state or execute the faulty behavior.
- If the symptom appears only after a later interaction, check whether the earlier step created latent state and the later step exposed it. Name the trigger and the exposure separately.
- If removing one step would prevent the bug entirely, that step is often the trigger.
- If the reproduction steps don't mention "go offline," assume the app is in online mode where results always come from the server.
    - Offline: Actions between "go offline" and "go online" are strictly client-side (optimistic).
    - Online: Once reconnected, all queued APIs will be triggered sequentially to the server.
    - No Reconnect: Without going back online, the changes remain purely client-side/optimistic.

Example:
- Weak: "The bug happens during the import flow."
- Stronger: "Step 4, tapping `Got it`, triggers modal dismissal logic that leaves stale history state behind; step 5 exposes that stale state."

## Evidence Strength Labels

Use the strongest label the evidence actually supports, not the label you wish it supported.

- `proven`: directly supported by logs, code behavior, traces, or a reproduction fact in the report.
- `inferred`: the link is plausible and fits the evidence, but no direct artifact proves it yet.
- `missing-evidence`: the report does not provide enough support to justify the link at all.

Examples:
- `proven`: "The actual result says device back returns to the import page after the modal is dismissed."
- `inferred`: "The modal dismissal likely leaves a stale history entry, but no trace or code reference confirms when that entry is removed."
- `missing-evidence`: "The app probably races two navigation actions." No log, trace, or code behavior in the report supports that claim.

## Missing Intermediate Mechanisms

A causal chain is incomplete when it jumps from trigger to symptom without explaining the bridge state or failing behavior.

Look for this pattern:
- trigger: what action starts the bad path
- state change: what internal condition changes
- failing behavior: what the app does incorrectly because of that state
- symptom: what the user observes

If one of those links is missing, do not smooth it over. Label it as `inferred` or `missing-evidence`.

Example:
- Weak: "Closing the modal causes the wrong navigation result."
- Stronger: "Closing the modal likely leaves stale history state, which then causes device back to navigate to the old import route."

## Symptom vs Cause

A symptom tells you what went wrong. A cause explains the mechanism that made it happen.

Common symptom-only statements:
- "Navigation goes to the wrong screen."
- "The selected value disappears."
- "The app shows stale data."

Stronger causal statements:
- "A stale route entry remains in history, so device back resolves to the import screen."
- "Local selection state is reset when the parent rerenders with an empty server payload."
- "Cached report actions are not invalidated after the optimistic update fails, so the UI keeps rendering old data."

## Rewriting Weak Claims

Rewrite polished hypotheses into auditable claims.

- Weak: "The bug is caused by bad modal handling."
- Better: "Step 4 likely triggers modal dismissal before history cleanup completes, leaving stale navigation state for step 5."

- Weak: "This is a race condition."
- Better: "Two navigation-related actions may run in overlapping order, but the report does not yet prove which one wins or where the stale state persists."

- Weak: "The import page stays in history."
- Better: "The report proves the import page is reachable via device back after dismissal, but the mechanism that preserves that history entry is still inferred."
