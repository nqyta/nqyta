# NQITA v1 State Engine

## Purpose

Define the canonical runtime state that bridges cognition, memory, and embodiment.

## Scope

This file owns the state object, precedence rules, cooldown and randomness policy, and the mapping from state to scene and animation.

## Non-goals

- sprite asset production
- SQL persistence details
- model provider APIs
- OS event subscription details

## Assumptions

- State is the single source of truth for what Nqita is doing right now.
- Scene and animation are derived from state, not the other way around.
- State changes are rate-limited to avoid visual thrash.

## What This File Does Not Own

This file does not define the renderer implementation, tool permission policy, or the exact SQL schema used to persist state logs.

## Normative Definitions and Interfaces

### Canonical State Object

```ts
type NqitaState = {
  mode: "PASSIVE" | "ASSISTANT" | "RESEARCH" | "YOLO";
  mood: "calm" | "focused" | "happy" | "concerned";
  task: "idle" | "observing" | "thinking" | "coding" | "browsing" | "error" | "sleeping";
  attentionTarget: "none" | "user" | "window" | "terminal" | "browser";
  intensity: number;
  urgency: "low" | "medium" | "high";
  privacyMode: "normal" | "muted" | "read_only";
  isVisible: boolean;
  sceneId: string;
  animationId: string;
  flags: string[];
};
```

### Precedence Rules

- Error state overrides all non-safety visuals.
- Privacy and read-only flags may suppress actions without hiding presence.
- Scene changes require stronger evidence than animation changes.
- Random ambient variation may change animation within the current scene only.

### Mapping Rules

| State pattern | Scene | Animation |
|---------------|-------|-----------|
| `task=idle` | `idle_corner` | `idle_a` or other idle variant |
| `task=thinking` | `idle_corner` | `curious` |
| `task=coding` | `desk_terminal` | `researching` or `typing` |
| `task=browsing` | `desk_browser` | `researching` |
| `task=error` | `alert_overlay` | `reaction` |
| `task=sleeping` | `idle_corner` | `sleeping` |

## Examples

Example state transition:

```text
window focus changes to terminal
-> daemon marks attentionTarget=terminal
-> router selects planning/tool decision flow
-> state becomes task=coding, mood=focused
-> sceneId=desk_terminal
-> animationId=researching
```

## Failure Modes

- If a scene cannot be resolved, the renderer falls back to `idle_corner`.
- If an animation is missing, the renderer keeps the current scene and uses `idle_a`.
- If state updates arrive too quickly, cooldown and hysteresis suppress intermediate visual churn.
- If privacy mode disables action, state remains visible with `read_only` in flags.

## Cross-references

- `ARCHITECTURE_V1.md`
- `DAEMON_LOOP_WINDOWS.md`
- `MODEL_ROUTER.md`
- `EMBODIMENT_PIPELINE.md`
- `MODES.md`
- `SPRITE_SYSTEM.md`
