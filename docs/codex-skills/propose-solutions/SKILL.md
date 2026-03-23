---
name: propose-solutions
description: Use when an Expensify issue has an approved root cause and you need a proposal in the standard solution format without drifting into unrelated refactors
---

# Propose Solutions

## Overview

Use this skill only after `root-cause-review` returns `approved`. It converts an approved root cause into an Expensify proposal with a direct problem statement, root-cause explanation, concrete changes, and optional alternatives.

## Required Input

You need:
- a bug ID
- the approved root-cause report
- the review output showing `approved`

If those inputs are not provided, first check:
- `./results/[bug-id]/root-cause-find-result.md`
- `./results/[bug-id]/root-cause-review-result.md`

If the review result is missing, obtain prerequisites in order:
1. use `root-cause-find` if its saved result is missing
2. use `root-cause-review`
3. only then continue to the proposal

If the review result exists but is not `approved`, do not propose solutions.

## Persistence Rules

- Save the final proposal to `./results/[bug-id]/propose-solutions-result.md`.
- Return the final proposal in the same run even if you had to backfill prerequisites first.

## Solution Flow

1. Restate the problem in one sentence.
2. Restate the approved root cause and support it with concrete evidence.
3. Propose the smallest effective change set that addresses that cause.
4. Explain why the proposed changes solve the problem.
5. Optionally include alternatives that were explored and not chosen.
6. Save the proposal under the provided bug ID.

## Output Rules

- Refuse to proceed without an approved root cause.
- Do NOT include the bug ID in the final proposal.
- Emit the exact required headings in the final answer.
- Tie every proposed change directly to the approved cause.
- Prefer minimal changes before broad refactors.
- Keep implementation guidance under the required headings instead of inventing new sections.
- The alternatives section may be omitted only if no meaningful alternatives were explored.
- If prerequisite result files are missing, obtain and save them first before writing the proposal.
- Save the completed proposal to `./results/[bug-id]/propose-solutions-result.md`.

## Output Format

Use the template in [`solution-options-template.md`](./solution-options-template.md).

The final answer must be:

```md
## Proposal

### Please re-state the problem that we are trying to solve in this issue.

### What is the root cause of that problem?

### What changes do you think we should make in order to solve the problem?

### What alternative solutions did you explore? (Optional)
```

Within those headings, it is acceptable to include:
- numbered causal analysis
- code references
- concrete change bullets
- short diffs or snippets

## Red Flags

Stop and correct course if you:
- proceed without review approval
- propose cleanup unrelated to the approved cause
- add new headings not required by the template
- present a fix without explaining why it addresses the root cause
