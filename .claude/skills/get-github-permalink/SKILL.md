---
name: get-github-permalink
description: Generate a GitHub permalink for a specific file and line range to quote exact code evidence.
allowed-tools: Bash
alwaysApply: false
---

# Get GitHub Permalink

## When to Use This Skill

Generate a **GitHub permalink** that points to an exact file and line range at a specific commit.

This skill ensures that any quoted code:

* Is immutable (pinned to a commit hash)
* Can be used as reliable evidence
* Is safe to reference in root cause analysis, PR reviews, or issue discussions

---

## When to Use This Skill

Use this skill when:

* Quoting code as evidence during root cause analysis
* Referencing specific lines in a PR comment
* Linking exact code in a GitHub issue
* Providing immutable proof of implementation details

Do **NOT** use this skill when:

* You need to read file content (use `Read`)
* You need to search the codebase (use grep or ts-morph)
* You do not know the exact file path
* You need a branch link instead of a commit permalink

---

## Required Inputs

| Parameter     | Required | Description                        |
| ------------- | -------- | ---------------------------------- |
| `$file_path`  | Yes      | Relative path from repository root |
| `$start_line` | Yes      | Starting line number               |
| `$end_line`   | No       | Ending line number (optional)      |

---

## Execution

Run the following command with **current skill directory** as `cwd`:

```bash
bash ./scripts/getGithubPermalink.sh $file_path $start_line $end_line
```

### Parameter Rules

* If `$end_line` is omitted → generate a single-line permalink
* If `$end_line` is provided → generate a range permalink (`#Lx-Ly`)
* Do not modify input values
* Do not guess missing values

---

## Expected Output

Return:

* The GitHub permalink URL only
* No explanation
* No markdown formatting
* No additional text
* No wrapping in backticks

Example valid output:

```
https://github.com/org/repo/blob/commit_hash/src/file.ts#L10-L20
```

---

## Agent Behavior Rules

The agent must:

* Always use the provided script
* Never manually construct the permalink
* Never infer or modify line numbers
* Never fallback to search-based link generation
* If the script fails, return the raw error output

---

## Scope Limitation

This skill has exactly one responsibility:

> Generate an exact GitHub permalink for quoting code evidence.

It must not perform any additional logic beyond that responsibility.
