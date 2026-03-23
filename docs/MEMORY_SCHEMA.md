# NQITA v1 Memory Schema

## Purpose

Define the local persistence model that gives Nqita continuity, recall, and recoverable execution history.

## Scope

This file defines storage classes, canonical tables, retrieval behavior, retention, backup, and migration rules for v1.

## Non-goals

- cloud sync
- provider-specific embedding APIs
- prompt design
- scene selection logic

## Assumptions

- SQLite is the only required persistence backend in v1.
- Embeddings are stored locally alongside SQLite-managed records.
- Vector search may use a SQLite-native extension path, but contracts remain backend-agnostic at the schema level.

## What This File Does Not Own

This file does not define routing policy, UI rendering, or Windows event collection.

## Normative Definitions and Interfaces

### Memory Classes

- `episodic`: things that happened
- `semantic`: facts and summaries worth retrieving later
- `identity`: persistent self and user-specific continuity
- `operational`: active tasks, recent tool results, transient working context

### Canonical Schema

```sql
CREATE TABLE identity_store (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE memory_items (
  id TEXT PRIMARY KEY,
  memory_class TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  embedding_ref TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE state_log (
  id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE task_log (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE tool_audit (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE embeddings_index_meta (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  version TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE user_preferences (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE project_context (
  project_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Retrieval Rules

- Identity memory is loaded before every routed model call.
- Operational memory is retrieved first for active tasks.
- Episodic and semantic memory are retrieved by relevance and recency together.
- Retrieval outputs must be bounded before prompt injection.

### Retention Rules

- `identity_store` and `user_preferences` do not expire automatically.
- `state_log`, `task_log`, and `tool_audit` are compacted on a rolling retention window.
- `memory_items` may be summarized forward, but the original record must remain available until compaction policy says otherwise.

## Examples

Example recall path:

```text
user asks about the last failed build
-> retrieve recent operational memory from task_log
-> retrieve related episodic items from memory_items
-> inject identity and project_context into router envelope
```

## Failure Modes

- If embedding generation fails, the record is still stored without an embedding reference.
- If vector lookup is unavailable, retrieval falls back to metadata filters plus recency ordering.
- If migration fails, the daemon must open the database read-only and emit degraded mode.
- If backup export fails, normal runtime continues and the failure is written to `tool_audit`.

## Cross-references

- `ARCHITECTURE_V1.md`
- `MODEL_ROUTER.md`
- `STATE_ENGINE.md`
- `TOOLS_AND_PERMS.md`
