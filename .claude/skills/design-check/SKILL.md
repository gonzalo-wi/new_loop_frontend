---
name: design-check
description: Audit LOOP UI code against the project's design system (industrial/enterprise look, functional color only, banned patterns like gradients/glassmorphism, shared-component reuse). Use when the user asks to review UI/design consistency, check styling, or before merging UI changes.
---

Delegate to the `loop-design-reviewer` subagent via the Agent tool (`subagent_type: "loop-design-reviewer"`).

By default, scope the review to the current uncommitted diff (`git status` / `git diff`). If the user names specific files or asks for a full-project audit, pass that scope instead (`$ARGUMENTS` if provided).

This subagent is read-only — it reports findings, it does not fix them. After it finishes, relay its findings to the user grouped by file. If the user then asks you to fix the findings, do that yourself directly (don't re-delegate) using standard edits, and only re-invoke the reviewer afterward if the user wants confirmation the fixes are clean.
