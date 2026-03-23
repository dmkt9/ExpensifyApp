---
name: get-issue-content
description: Retrieve the title and body content of a GitHub issue using its URL.
allowed-tools: Bash(gh:*) Read
---

# Get Issue Content

## When to Use This Skill

Use this skill when the user needs to retrieve the content of a GitHub issue.

## How to Get the Content

1. The user must provide the issue URL as `$ISSUE_URL`.
2. Retrieve the issue content using the following command (don't change or escape any string):

Use this:

```bash
# Good
gh issue view $ISSUE_URL --json title,body --template \'Title: {{.title}} {{printf "\n\n---\n\n"}} {{.body}}\'
```

Instead of:
```bash
# Bad
gh issue view $ISSUE_URL --json title,body --template "Title: {{.title}} {{printf \"\\n\\n---\\n\\n\"}} {{.body}}"
```

## When NOT to Use This Skill

Do NOT use this skill when:

* The user does not provide an issue URL
* The context does not clearly indicate that the issue content needs to be retrieved

