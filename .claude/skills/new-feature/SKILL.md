---
name: new-feature
description: Scaffold a brand-new business module/feature in the LOOP admin frontend (types, service with DTO adapters, page, router + sidebar wiring). Use when the user asks to add a new module/feature/section to LOOP (e.g. "add a Warehouses module", "create a new feature for returns").
---

Delegate to the `loop-feature-builder` subagent via the Agent tool (`subagent_type: "loop-feature-builder"`).

Before delegating, make sure you have (ask the user via AskUserQuestion if genuinely ambiguous, otherwise infer from context and note assumptions):

1. The entity/domain name (singular, PascalCase, English).
2. Its core fields.
3. Whether it's full CRUD or read-only/reporting.
4. Whether a real backend endpoint already exists for it (check `api.md` at the project root yourself first — don't just ask).

Pass all of this in the prompt to the subagent, along with the arguments the user gave this skill (`$ARGUMENTS` if provided). After the subagent finishes, relay its summary (files created, mock vs. real-backed, route path, and any flagged assumptions) to the user — don't just say "done."
