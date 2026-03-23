# NQITA Roadmap

## Purpose

Capture phased expansion after v1 without weakening the normative contracts defined elsewhere.

## Scope

This file lists future phases only.

## Non-goals

- redefining v1 contracts
- replacing subsystem ownership
- backfilling missing v1 normative details

## Assumptions

- v1 contracts remain the baseline for future phases unless superseded by a later explicit versioned architecture set.

## What This File Does Not Own

This file does not define current implementation behavior. Nothing here overrides or weakens v1 normative contracts.

## Normative Definitions and Interfaces

### Phase Plan

| Phase | Focus |
|-------|-------|
| v1 | single daemon, local memory, state engine, basic embodiment, safe tool boundaries |
| v2 | mature router behavior, three-tool workflow, desk terminal/browser scenes |
| v3 | richer scene system, adaptive memory summarization, stronger audit/observability |
| v4 | external tool/context bridges via interoperable protocols |
| v5 | governed self-improvement proposals with explicit approval gates |

## Examples

Example boundary:

- v4 may add external context bridges.
- v4 does not change the rule that identity remains outside model providers unless a later versioned architecture spec says so.

## Failure Modes

- If roadmap items conflict with v1 normative docs, the v1 docs win.
- If a future phase needs a contract break, it must ship with a new versioned architecture set.

## Cross-references

- `NQITA_V1_INDEX.md`
- `ARCHITECTURE_V1.md`
