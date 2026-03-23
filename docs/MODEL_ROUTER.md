# NQITA v1 Model Router

## Purpose

Define how Nqita selects, frames, validates, and falls back across model providers without giving those providers ownership of identity.

## Scope

This file covers the adapter contract, routing matrix, request envelope, retries, fallback behavior, and tool-use policy.

## Non-goals

- storage schema
- Windows observation logic
- renderer implementation
- provider-specific pricing tables

## Assumptions

- Claude and GPT are the only required cognition providers in v1.
- Identity is injected from persistent stores before each request.
- Tool authority remains outside the router.

## What This File Does Not Own

This file does not define SQL tables, scene composition, or audit retention.

## Normative Definitions and Interfaces

### Adapter Interface

```ts
type ModelRequest = {
  taskType: "chat" | "plan" | "summarize" | "tool_decision";
  identity: object;
  memoryContext: object[];
  stateContext: object;
  toolPolicy: object;
  prompt: string;
};

type ModelResponse = {
  content: string;
  structured?: object;
  toolIntents?: object[];
  validationNotes?: string[];
};

interface ModelAdapter {
  name: string;
  invoke(request: ModelRequest): Promise<ModelResponse>;
}
```

### Routing Rules

- Claude handles long-context chat, summarization, and style continuity.
- GPT handles planning, schema-constrained outputs, and tool decision support.
- A future fallback slot may exist, but it is not required in v1.
- Identity is external to all models and must be injected by the router from persistent stores.

### Validation Rules

- Structured outputs are validated before the daemon consumes them.
- Invalid structured output triggers one repair attempt on the same provider.
- Repeated failure falls back to the alternate provider or to read-only degraded mode.

### Tool-use Policy

- Models may propose tool intents.
- Models may not directly execute tools.
- Every tool intent is checked against `TOOLS_AND_PERMS.md` before execution.

## Examples

Example routing matrix:

| Task | Preferred provider | Fallback |
|------|--------------------|----------|
| conversational reply | Claude | GPT |
| execution plan | GPT | Claude |
| state summary | Claude | GPT |
| tool intent generation | GPT | Claude |

## Failure Modes

- If Claude is unavailable, chat and summarization route to GPT with the same identity envelope.
- If GPT is unavailable, planning routes to Claude and may return reduced structure.
- If both providers fail, Nqita emits degraded mode and remains visually present.
- If validation fails repeatedly, the router returns a safe no-op result instead of invoking tools.

## Cross-references

- `ARCHITECTURE_V1.md`
- `MEMORY_SCHEMA.md`
- `STATE_ENGINE.md`
- `TOOLS_AND_PERMS.md`
