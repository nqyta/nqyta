# NQITA v1 Implementation Status

## Current Phase

- Phase 6: model router abstraction from `docs/MODEL_ROUTER.md`

## Last Completed Task

- docs entry wiring completed
- v1 state engine implemented
- v1 daemon skeleton implemented
- v1 SQLite memory layer implemented
- v1 embodiment placeholder implemented

## Landed Artifacts

- `README.md`
- `CONTRIBUTING.md`
- `docs/NQITA_V1_INDEX.md`
- `docs/ARCHITECTURE_V1.md`
- `docs/DAEMON_LOOP_WINDOWS.md`
- `docs/MEMORY_SCHEMA.md`
- `docs/STATE_ENGINE.md`
- `docs/EMBODIMENT_PIPELINE.md`
- `docs/MODEL_ROUTER.md`
- `docs/TOOLS_AND_PERMS.md`
- `docs/ROADMAP.md`
- `src/lib/state-engine.ts`
- `src/lib/state-engine.test.ts`
- `src/lib/daemon.ts`
- `src/lib/daemon.test.ts`
- `src/lib/memory.ts`
- `src/lib/memory.test.ts`
- `src/lib/embodiment.ts`
- `src/lib/embodiment.test.ts`

## Verified

- docs entry wiring updated in `README.md` and `CONTRIBUTING.md`
- focused tests pass for state engine
- focused tests pass for daemon skeleton
- focused tests pass for SQLite memory layer
- focused tests pass for embodiment placeholder
- focused type-check passes for `state-engine`, `daemon`, `memory`, and `embodiment` modules together

## Known Stubs

- Windows observation providers are stubbed only
- `embeddings_index_meta` is metadata-only; no real embedding generation or vector retrieval
- `task_log` and `tool_audit` tables exist, but no dedicated helpers are implemented yet
- no actual renderer exists yet; the embodiment layer is placeholder-only
- no model router abstraction implemented yet
- no tools/perms enforcement implemented yet

## Open Ambiguities

- `docs/STATE_ENGINE.md` does not define numeric hysteresis/cooldown defaults
- `docs/DAEMON_LOOP_WINDOWS.md` does not define loop cadence or heartbeat cadence
- `docs/MEMORY_SCHEMA.md` does not define migration/versioning mechanics or retention windows
- `docs/STATE_ENGINE.md` includes `observing` in the task union but does not define a mapping row for it
- `docs/EMBODIMENT_PIPELINE.md` requires `stateId` in `OverlayUpdate`, but current daemon IPC does not provide one directly

## Current Blocked-By

- none

## Next Narrow Task

- implement the model router abstraction strictly from `docs/MODEL_ROUTER.md`

## Guardrails For Next Session

- do not touch model routing
- do not add tool execution or permission enforcement yet
- do not invent new state fields
- do not bypass the canonical layer order in `docs/EMBODIMENT_PIPELINE.md`
- do not move identity into model-specific code
- keep visual presence functional even if all write-capable tools remain disabled
- do not couple the router to renderer or persistence internals beyond the documented contracts

## Resume Prompt

```text
You are continuing Nqita v1 from the canonical docs and current implementation status.

Read first:
- docs/NQITA_V1_INDEX.md
- docs/IMPLEMENTATION_STATUS.md
- docs/MODEL_ROUTER.md

Current completed layers:
- docs entry wiring
- state engine
- daemon skeleton
- SQLite memory layer
- embodiment placeholder

Current task:
- implement the model router abstraction from docs/MODEL_ROUTER.md

Rules:
- implement only this contract
- do not invent missing contracts
- do not touch unrelated subsystems
- add tests
- report ambiguities explicitly

Deliver:
- smallest viable patch
- tests
- summary of landed files
- known stubs
- next narrow task
```

## Session Checkpoint

```text
Session checkpoint:
- Completed: v1 embodiment placeholder implemented
- Files changed: src/lib/embodiment.ts, src/lib/embodiment.test.ts
- Tests passing: state-engine, daemon, memory, and embodiment focused tests
- Known stubs: Windows observation providers, embeddings/vector retrieval, renderer, router, tools/perms helpers
- Known ambiguities: no numeric hysteresis defaults, no daemon cadence contract, no migration/versioning contract, no explicit observing mapping row, no daemon-provided stateId
- Next task: model router abstraction from docs/MODEL_ROUTER.md
- Do not change: tool execution, permission enforcement, canonical state contract, embodiment layer order
```
