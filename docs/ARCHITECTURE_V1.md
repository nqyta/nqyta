# NQITA v1 Architecture

## Purpose

Define the top-level process boundaries, trust boundaries, replacement points, and continuity rules for Nqita v1.

## Scope

This file is the system contract for the local desktop agent. It covers how the major subsystems fit together, not their detailed behavior.

## Non-goals

- detailed Windows event subscription logic
- detailed memory schema
- detailed model routing policy
- renderer asset naming or frame timing specifics

## Assumptions

- Windows is the first shipping desktop target.
- Tauri packages the overlay shell and bundles the daemon as a sidecar.
- The daemon and overlay are separate processes.
- Local SQLite is the only required persistence backend in v1.

## What This File Does Not Own

This file does not define state precedence, SQL tables, prompt templates, tool confirmation rules, or render-layer timing.

## Normative Definitions and Interfaces

### System Boundary Diagram

```text
[ Tauri Overlay / Visual Shell ]
          |
          | IPC
          v
[ Node/TS Daemon ]
    |        |        |
    |        |        +--> [ Tool Authority + Audit ]
    |        |
    |        +--> [ State Engine ]
    |                     |
    |                     v
    |               [ Model Router ]
    |                |          |
    |                |          +--> [ GPT Adapter ]
    |                +--------------> [ Claude Adapter ]
    |
    +--> [ Memory Layer: SQLite + Embeddings ]
```

### Architectural Rules

- The overlay owns presence and rendering only.
- The daemon owns observation, cognition, memory access, tool coordination, and IPC emission.
- Identity continuity lives in persistent stores, not inside model providers.
- Every model adapter is replaceable without changing memory, state, or embodiment contracts.
- Tool authority is isolated behind confirmation and audit policy even when calls originate from the daemon.

### Identity Continuity

Nqita remains the same entity across model swaps and runtime rewrites if these three stores persist:

- `identity_store`
- `user_preferences`
- `project_context`

Replacing Claude, GPT, PixiJS, or Node-side execution must not invalidate those stores.

## Examples

Example replacement path:

- v1 uses Node/TypeScript for orchestration.
- v2 moves high-frequency OS bindings to Rust.
- No schema or IPC change is required if `STATE_ENGINE.md` and `EMBODIMENT_PIPELINE.md` contracts are preserved.

## Failure Modes

- If the daemon is unavailable, the overlay may remain visible in degraded mode but cannot observe or act.
- If memory is unavailable, the daemon may continue with session-local behavior only.
- If a model provider is unavailable, routing falls back according to `MODEL_ROUTER.md`.
- If the renderer degrades, the daemon continues to run and emits reduced visual state.

## Cross-references

- `NQITA_V1_INDEX.md`
- `STATE_ENGINE.md`
- `DAEMON_LOOP_WINDOWS.md`
- `MEMORY_SCHEMA.md`
- `MODEL_ROUTER.md`
- `EMBODIMENT_PIPELINE.md`
- `TOOLS_AND_PERMS.md`
