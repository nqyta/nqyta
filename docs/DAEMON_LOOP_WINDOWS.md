# NQITA v1 Daemon Loop on Windows

## Purpose

Define the lifecycle and runtime contract for the always-on Windows daemon.

## Scope

This file covers daemon startup, observation, decision flow, crash behavior, and Windows-specific operating assumptions.

## Non-goals

- non-Windows OS integration
- SQL table design
- renderer layer rules
- model prompt specifics

## Assumptions

- The daemon is packaged as a Tauri sidecar.
- Observation should prefer Windows event subscriptions over constant polling.
- The daemon runs at below-normal or idle priority.

## What This File Does Not Own

This file does not define memory schema, scene composition, or permission tier semantics.

## Normative Definitions and Interfaces

### Daemon Lifecycle

```text
boot -> load config -> restore mode/state -> attach Windows observers
     -> open SQLite -> announce ready to overlay -> run loop
     -> on crash: watchdog restart -> restore persisted state -> resume loop
```

### Main Loop Contract

The daemon loop is normative:

1. `observe`
2. `decide`
3. `act`
4. `reflect`

Each phase consumes a bounded work queue. No phase may spin indefinitely.

### Observation Rules

- Primary event sources are `SetWinEventHook` and UI Automation subscriptions.
- Polling is allowed only for signals that do not expose usable events.
- Polling intervals must be capped and documented per signal source.
- Screen scraping is not a primary observation mechanism in v1.

### Resource Rules

- Idle CPU target: under 2 percent
- Priority class: below normal or idle
- A stuck tool invocation must not block the observation queue
- A blocked model request must not stall IPC heartbeats to the overlay

## Examples

Example boot sequence:

```text
1. daemon starts
2. read persisted mode from state store
3. connect to SQLite
4. subscribe to foreground-window and focus events
5. emit READY to overlay
6. begin observe -> decide -> act -> reflect loop
```

## Failure Modes

- If Windows accessibility permissions are unavailable, observation drops to reduced signals and the daemon emits degraded mode.
- If SQLite is locked or corrupt, memory-backed features are disabled and the daemon continues session-local.
- If the daemon crashes, a watchdog restarts it and replays only persisted state, not transient in-memory queues.
- If the overlay disconnects, the daemon continues running and buffers only the latest state snapshot.

## Cross-references

- `ARCHITECTURE_V1.md`
- `STATE_ENGINE.md`
- `MEMORY_SCHEMA.md`
- `TOOLS_AND_PERMS.md`
- `AGENT_RUNTIME.md`
