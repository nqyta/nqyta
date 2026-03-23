# NQITA v1 Tools and Permissions

## Purpose

Define what the daemon may do, what it may not do, and how every tool action is constrained and audited.

## Scope

This file covers the v1 tool inventory, scope boundaries, confirmation tiers, audit behavior, and read-only fallback mode.

## Non-goals

- renderer details
- SQL storage specifics beyond audit expectations
- model adapter logic
- OS event subscriptions

## Assumptions

- Tool execution is mediated by the daemon, not by the overlay.
- The visual shell remains available even when write-capable tools are disabled.
- Audit coverage is required for every mutating attempt, even if denied.

## What This File Does Not Own

This file does not define memory retention policy, state-to-scene mapping, or provider routing.

## Normative Definitions and Interfaces

### Tool Inventory

| Tool | Allowed in v1 | Notes |
|------|----------------|-------|
| filesystem read | yes | limited to approved scopes |
| filesystem write | yes | requires scope and confirmation policy |
| terminal execution | yes | scoped and auditable |
| git status/diff/log/branch | yes | read-heavy default posture |
| browser handoff/open URL | optional | no DOM injection |

### Confirmation Tiers

- `soft_deny`: tool request is blocked by policy but may be retried in safer form
- `hard_deny`: tool request is never allowed in the current context
- `human_confirmation_required`: tool request is valid but requires explicit user approval

### Authority Rules

- Filesystem and terminal authority must be scoped to approved work areas.
- Mutating git or filesystem actions default to `human_confirmation_required`.
- Read-only mode disables write-capable tools without disabling observation or embodiment.
- Every tool request produces an audit event with requested action, policy result, and outcome.

## Examples

Example policy outcome:

```text
model proposes file write outside approved workspace
-> daemon evaluates scope
-> policy result = hard_deny
-> tool_audit record written
-> state remains visible with read_only or denied-action flag
```

## Failure Modes

- If policy evaluation fails, the daemon denies the action and records the failure.
- If audit persistence fails, the daemon may continue read-only but must not run new mutating actions.
- If terminal execution times out, the daemon kills the process and records the timeout outcome.
- If the approved scope cannot be resolved, filesystem access falls back to read-only denial.

## Cross-references

- `ARCHITECTURE_V1.md`
- `DAEMON_LOOP_WINDOWS.md`
- `MEMORY_SCHEMA.md`
- `MODEL_ROUTER.md`
