---
name: root-cause-review
description: Use when a candidate Expensify root-cause report exists and you need to verify whether its claimed causal chain is actually proven and aligned with the reported reproduction steps
---

# Root Cause Review

## Overview

Use this skill to review a candidate root cause with an adversarial posture. The goal is not to be agreeable. The goal is to decide whether the claimed cause is actually demonstrated.

## Required Input

Provide:

- a bug ID
- the completed root-cause report from `root-cause-find`, or an equivalent report with the same sections

If the root-cause report is not provided, first check for `./results/[bug-id]/root-cause-find-result.md`.
If that file does not exist, obtain the root-cause result with `root-cause-find`, save it, and then continue with the review.

## Persistence Rules

- Save the final review to `./results/[bug-id]/root-cause-review-result.md`.
- Later steps depend on this exact file path.

## Review Flow

1. Verify the report explains the exact gap between `Expected Result` and `Actual Result`.
2. Check whether the numbered `Action Performed` steps actually exercise the claimed root-cause flow.
3. Trace the claimed chain explicitly:
   `Action Performed -> triggering condition -> intermediate state change -> failing behavior -> observed symptom`
4. Check whether the evidence directly supports each major link in that chain.
5. Separate proven facts from assumptions, correlations, or plausible but unproven inferences.
6. Look for at least one plausible alternative explanation.
7. Decide whether the causal chain is complete and aligned with the repro flow.
8. Return a verdict: `approved`, `rejected`, or `insufficient-evidence`.
9. Save the review result under the provided bug ID.

## Decision Rules

- `approved`: Evidence directly supports the full causal chain, and that chain explains why the actual result differs from the expected result when following the reported repro steps.
- `rejected`: The claimed root cause conflicts with the evidence, conflicts with the repro flow, or only describes a symptom instead of the mechanism that produced it.
- `insufficient-evidence`: The theory may be plausible, but one or more causal links are inferred rather than proven, or the report does not prove that the repro steps actually exercise the claimed cause.

## Output Rules

- Do not propose fixes or implementation changes.
- Include the bug ID and the saved root-cause report path in the review output.
- State whether the reported repro steps exercise the claimed cause.
- Trace where the causal chain is complete and where it becomes unsupported.
- Challenge missing links in the causal chain.
- Require explicit evidence for each major claim.
- Reject root causes that are merely correlated symptoms.
- Treat any unproven causal link as a blocker for `approved`.
- State exactly what evidence gap remains when confidence is insufficient.
- If the root-cause-find result is missing, obtain it first instead of stopping.
- Save the completed review to `./results/[bug-id]/root-cause-review-result.md`.

## Output Format

Use this structure:

```md
## Bug ID

## Source Root Cause Report

## Review Verdict
approved | rejected | insufficient-evidence

## Why

## Reproduction Alignment

## Evidence Check

## Causal Chain Check

## Alternative Explanations Considered

## Required Follow-up Evidence
```

Apply the checklist in [`root-cause-review-checklist.md`](./root-cause-review-checklist.md).

## Red Flags

Stop and correct course if you:
- approve a root cause because it sounds reasonable
- approve a report without checking whether the numbered repro steps exercise the claimed cause
- approve a chain that jumps from trigger to symptom without an intermediate mechanism
- approve a chain with any missing proof
- accept correlation as causation
- skip alternative explanations
- begin suggesting code changes
