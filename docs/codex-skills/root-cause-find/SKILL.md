---
name: root-cause-find
description: Use when an Expensify bug report is provided in the standard issue template and you need to investigate its causal chain before reviewing fixes
---

# Root Cause Find

## Overview

Use this skill to turn an Expensify bug report into a structured causal-chain report. Investigation comes before fixes. Preserve the original bug fields, compare expected and actual behavior explicitly, trace the path from repro steps to symptom, and separate evidence from inference.

## Required Input

The input must include:

- a bug ID
- the Expensify bug report

The bug report must use this template:

```md
#TITLE:

**Version Number:**
**Reproducible in staging?:**
**Reproducible in production?:**
**If this was caught during regression testing, add the test name, ID and link from BrowserStack:**
**Email or phone of affected tester (no customers):**
**Logs:**
**Expensify/Expensify Issue URL:**
**Issue reported by:**
**Slack conversation** (hyperlinked to channel name):

## Action Performed:
Break down in numbered steps

## Expected Result:
Describe what you think should've happened

## Actual Result:
Describe what actually happened

## Workaround:
Can the user still use Expensify without this being fixed? Have you informed them of the workaround?

## Platforms:
Select the officially supported platforms where the issue was reproduced:
- [ ] Android: App
- [ ] Android: mWeb Chrome
- [ ] iOS: App
- [ ] iOS: mWeb Safari
- [ ] iOS: mWeb Chrome
- [ ] Windows: Chrome
- [ ] MacOS: Chrome / Safari
```

If the input does not follow this format, first restate the missing fields you need.

## Persistence Rules

- Treat the bug ID as required input.
- Save the final output to `./results/[bug-id]/root-cause-find-result.md`.
- If a saved result already exists, you may use it as prior context, but this run should still return the final root-cause answer the user requested.
- Static analysis ONLY.
- Before starting the investigation, read [`CLAUDE.md`](./CLAUDE.md) in this directory for the Expensify-specific root-cause investigation context and use it to guide where to look first.

If you need help identifying the triggering repro step, deciding whether a causal link is `proven`, `inferred`, or `missing-evidence`, or spotting a missing intermediate mechanism, consult [`reasoning-tips.md`](./reasoning-tips.md).

## Investigation Flow

1. Read [`CLAUDE.md`](./CLAUDE.md) in this directory before inspecting code so the investigation uses the correct repo-specific mental model and hotspot map.
2. Restate the bug in one sentence.
3. Parse the metadata fields without renaming them.
4. Compare the exact `Expected Result` versus `Actual Result` gap.
5. Extract the repro path from `Action Performed`.
6. Identify which repro step triggers the failure path.
7. Identify platform scope from the checked boxes only.
8. Trace the chain explicitly:
   `Action Performed -> triggering condition -> intermediate state change -> failing behavior -> observed symptom`
9. Label each major causal link as `proven`, `inferred`, or `missing-evidence`.
10. Call out missing information that limits confidence.
11. Report a firm root cause only when the full chain is supported; otherwise report a tentative candidate causal chain.
12. Save the final report under the provided bug ID.

## Output Rules

- Do not propose fixes.
- Preserve the bug-report field names from the input in the parsed metadata section.
- Include the bug ID in the report.
- Treat unchecked or omitted platform data as unknown unless the report explicitly rules them out.
- Treat missing logs, missing repro environment data, and absent code pointers as confidence limits.
- Distinguish evidence from inference.
- State which repro step triggers the failure path.
- Trace the causal chain from trigger to symptom without skipping the intermediate mechanism.
- Label each major causal link as `proven`, `inferred`, or `missing-evidence`.
- Only use a firm root-cause statement when the full chain is directly supported.
- If the report is too weak, provide a `Candidate Causal Chain` instead of presenting a settled root cause.
- Tie unknowns and next evidence needs to the specific unsupported links.
- Save the completed report to `./results/[bug-id]/root-cause-find-result.md`.

## Output Format

Use the template in [`root-cause-report-template.md`](./root-cause-report-template.md).

Minimum required sections:
- `## Bug ID`
- `## Bug Summary`
- `## Parsed Bug Metadata`
- `## Action Performed`
- `## Expected Result`
- `## Actual Result`
- `## Workaround`
- `## Platforms`
- `## Evidence Gathered`
- `## Triggering Repro Step`
- `## Reproduction Status`
- `## Causal Chain`
- `## Causal Link Evidence`
- `## Eliminated Hypotheses`
- `## Root Cause` or `## Candidate Causal Chain`
- `## Confidence / Unknowns`
- `## Next Evidence Needed`

## Red Flags

Stop and correct course if you:
- propose implementation changes
- skip the expected versus actual comparison
- skip identifying which repro step triggers the issue
- jump from symptom to root cause without an intermediate mechanism
- rewrite the bug in a way that drops metadata
- present assumptions as proven facts
- present a polished hypothesis as settled when one link is still inferred
- ignore missing evidence and claim high confidence anyway
