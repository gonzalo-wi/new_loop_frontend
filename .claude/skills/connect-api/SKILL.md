---
name: connect-api
description: Connect an existing LOOP feature's mock service to the real backend, or update a service after the backend contract changed. Use when the user asks to "wire up", "connect to the backend", "integrate the API for", or "hook up" a feature, or says a backend endpoint/field changed.
---

Delegate to the `loop-api-integrator` subagent via the Agent tool (`subagent_type: "loop-api-integrator"`).

Before delegating, identify which feature (`src/features/{domain}`) is being integrated. If the user didn't name it, infer it from conversation context or the files currently open/discussed — ask only if genuinely ambiguous.

Pass to the subagent: the feature/domain name, and any arguments the user gave this skill (`$ARGUMENTS` if provided). Remind it in the prompt to treat `api.md` at the project root as the source of truth and to flag rather than guess if the endpoint isn't documented there.

After the subagent finishes, relay its summary (endpoints wired, field-name mismatches adapted, any gaps flagged) to the user.
