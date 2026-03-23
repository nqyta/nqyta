# NQITA v1 Embodiment Pipeline

## Purpose

Define how daemon state becomes visible presence through IPC, layered rendering, and constrained overlay behavior.

## Scope

This file covers the overlay contract, canonical layer order, renderer expectations, scaling rules, and degraded rendering behavior.

## Non-goals

- sprite art production workflow
- tool confirmation policy
- SQL design
- Windows accessibility details

## Assumptions

- The overlay runs inside Tauri.
- PixiJS is the default reference renderer.
- Equivalent layered 2D renderers are allowed if they preserve the same contracts.

## What This File Does Not Own

This file does not define state precedence, Windows event sources, or tool scopes.

## Normative Definitions and Interfaces

### IPC Payload

```ts
type OverlayUpdate = {
  stateId: string;
  sceneId: string;
  animationId: string;
  visible: boolean;
  bubbleText?: string;
  flags: string[];
  deviceSurface?: {
    kind: "terminal" | "browser";
    contentRef: string;
  };
};
```

### Layer Order

The canonical draw order is:

`background -> props -> body -> accessories -> device screens -> effects -> UI`

### Rendering Rules

- Nearest-neighbor scaling is required for sprite assets.
- Frame and update budgets are explicit and may back off under load.
- Click-through is the default window behavior outside interaction zones.
- Focus handoff must not block the user from interacting with underlying desktop content.
- Device-screen content is layered independently from body animation so the same scene can show different terminal or browser states.

## Examples

Example desk scene composition:

```text
sceneId=desk_terminal
background=room
props=desk, chair, monitor
body=nqita seated
accessories=apron glow
device screens=terminal log view
effects=typing sparkle
UI=bubble "checking the build"
```

## Failure Modes

- If device-screen content fails to load, the scene still renders with a placeholder monitor surface.
- If the renderer exceeds frame budget, effects are dropped before body animation is dropped.
- If the overlay loses IPC updates, it keeps the last valid state snapshot and marks itself degraded.
- If click-through toggling fails, the overlay must prefer pass-through over blocking user input.

## Cross-references

- `ARCHITECTURE_V1.md`
- `STATE_ENGINE.md`
- `SPRITE_SYSTEM.md`
