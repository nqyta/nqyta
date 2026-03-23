# NQITA v1 Index

## Purpose

This docs set defines Nqita v1 as a Windows-first, persistent, embodied local agent.

It exists to make Nqita implementable without inventing missing contracts across runtime, memory, model routing, embodiment, or permissions.

## Scope

These documents are the normative v1 specification for the desktop-local agent architecture.

## Non-goals

- macOS/Linux parity in v1
- cloud-required persistence
- multi-agent society architecture in v1
- autonomous self-modification in v1
- 3D or AR avatar systems
- unrestricted terminal or filesystem authority
- model-specific identity storage
- screen-scraping-first observation

## Assumptions

- Nqita targets Windows first.
- The visual shell runs in Tauri.
- The runtime daemon is Node.js with TypeScript.
- Persistent memory is local SQLite plus embeddings.
- Claude and GPT are replaceable cognition providers behind a router.
- The overlay and daemon are separate processes connected by IPC.
- The visual shell remains functional even if write-capable tools are disabled.

## What This File Does Not Own

This file does not define subsystem behavior. It only defines navigation, ownership, and vocabulary for the v1 docs set.

## Normative Definitions and Interfaces

### Normative Vocabulary

| Term | Definition |
|------|------------|
| `state` | Internal runtime truth describing mode, mood, task, urgency, visibility, and error posture. |
| `scene` | Environmental composition shown by the renderer, such as `idle_corner` or `desk_terminal`. |
| `animation` | Motion sequence played within a scene, such as `idle_a` or `typing`. |
| `embodiment` | The visible manifestation of state through scenes, animation, layered props, and UI affordances. |
| `identity` | Persistent Nqita-specific continuity stored outside model providers. |
| `memory_item` | A stored unit of recall in SQLite, including content, type, metadata, and optional embedding. |
| `operational memory` | Short-horizon execution context such as active tasks, recent tool results, and unresolved errors. |
| `tool_action` | A single authorized capability invocation, such as a file read or `git status`. |
| `degraded mode` | A state where one subsystem has failed and Nqita continues with reduced capability. |

## Canonical Assumptions

- Windows observation is event-first and poll-second.
- PixiJS is the default reference renderer; equivalent layered 2D renderers are allowed if contracts remain identical.
- Identity is persistent and external to model providers.
- State is the bridge between cognition and embodiment.
- Permissions are first-class architecture, not a later safety add-on.

## Document Map

| File | Owns |
|------|------|
| `ARCHITECTURE_V1.md` | System boundaries, replacement points, trust/failure domains, identity continuity |
| `STATE_ENGINE.md` | Canonical runtime state and state-to-scene-to-animation rules |
| `DAEMON_LOOP_WINDOWS.md` | Windows runtime lifecycle, observation loop, watchdog behavior |
| `MEMORY_SCHEMA.md` | Persistence schema, memory classes, retrieval/retention rules |
| `MODEL_ROUTER.md` | Model adapters, routing, prompt envelope, validation, tool-use policy |
| `EMBODIMENT_PIPELINE.md` | IPC-to-render contract, layering, scaling, degraded rendering |
| `TOOLS_AND_PERMS.md` | Tool inventory, scope boundaries, audit, confirmation tiers |
| `ROADMAP.md` | Phased future work that does not override v1 contracts |

## Read Order

1. `ARCHITECTURE_V1.md`
2. `STATE_ENGINE.md`
3. `DAEMON_LOOP_WINDOWS.md`
4. `MEMORY_SCHEMA.md`
5. `MODEL_ROUTER.md`
6. `EMBODIMENT_PIPELINE.md`
7. `TOOLS_AND_PERMS.md`
8. `ROADMAP.md`

## Success Criteria

A contributor should be able to implement the daemon loop, memory layer, router, state engine, and desk-scene embodiment without inventing missing schemas or boundaries.

## Acceptance Checklist

- Each subsystem has exactly one normative file.
- Every file includes Purpose, Scope, Non-goals, Assumptions, What this file does not own, Normative definitions/interfaces, Examples, Failure modes, and Cross-references.
- Every file includes at least one concrete example.
- Every file contains exactly one canonical schema, diagram, or interface block.
- Swapping Claude or GPT does not change memory or embodiment contracts.
- The system remains locally runnable with cloud disabled.
- All write-capable actions can be denied while the visual shell continues to run.

## Examples

Example implementation path:

1. Read `ARCHITECTURE_V1.md` to understand process boundaries.
2. Implement the canonical state object from `STATE_ENGINE.md`.
3. Build daemon lifecycle behavior from `DAEMON_LOOP_WINDOWS.md`.
4. Add SQLite tables and retrieval from `MEMORY_SCHEMA.md`.
5. Connect routed cognition and safe tool evaluation from `MODEL_ROUTER.md` and `TOOLS_AND_PERMS.md`.
6. Render the desk scene contract from `EMBODIMENT_PIPELINE.md`.

## Failure Modes

- If two docs claim ownership of the same behavior, `NQITA_V1_INDEX.md` must be updated before implementation proceeds.
- If a future change weakens a v1 contract without a new versioned docs set, the v1 files remain authoritative.
- If a contributor cannot implement a subsystem without inventing a schema or boundary, the missing contract must be added to the owning file before code work continues.

## Cross-references

- `AGENT_RUNTIME.md`
- `CURIOSITY_SYSTEM.md`
- `MODES.md`
- `SPRITE_SYSTEM.md`
