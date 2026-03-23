import type { Message } from '../types';
import type { NqitaStateSnapshot } from './state-engine';

const MAX_MESSAGES = 40;
const TTL_SECONDS = 60 * 60 * 24 * 7;

const CANONICAL_TABLES = [
  'identity_store',
  'memory_items',
  'state_log',
  'task_log',
  'tool_audit',
  'embeddings_index_meta',
  'user_preferences',
  'project_context',
] as const;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS identity_store (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_items (
  id TEXT PRIMARY KEY,
  memory_class TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  embedding_ref TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS state_log (
  id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_log (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_audit (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS embeddings_index_meta (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  version TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_context (
  project_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

type DatabaseSync = import('node:sqlite').DatabaseSync;

export type NqitaMemoryClass = 'episodic' | 'semantic' | 'identity' | 'operational';

export interface MemoryStatus {
  degraded: boolean;
  available: boolean;
  path: string;
  lastError: string | null;
}

export interface ProjectContextRecord {
  projectId: string;
  summary: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface MemoryItemRecord {
  id: string;
  memoryClass: NqitaMemoryClass;
  content: string;
  metadata: Record<string, unknown>;
  embeddingRef: string | null;
  createdAt: string;
}

export interface OpenNqitaMemoryOptions {
  path: string;
  now?: () => Date;
}

export interface NqitaMemoryStore {
  initialize(): Promise<void>;
  close(): Promise<void>;
  getStatus(): MemoryStatus;
  getLatestStateSnapshot(): Promise<NqitaStateSnapshot | null>;
  appendStateLog(snapshot: NqitaStateSnapshot, id?: string): Promise<boolean>;
  readStateLog(limit?: number): Promise<NqitaStateSnapshot[]>;
  setIdentity<T>(key: string, value: T): Promise<boolean>;
  getIdentity<T>(key: string): Promise<T | null>;
  setUserPreference<T>(key: string, value: T): Promise<boolean>;
  getUserPreference<T>(key: string): Promise<T | null>;
  upsertProjectContext(record: Omit<ProjectContextRecord, 'updatedAt'>): Promise<boolean>;
  getProjectContext(projectId: string): Promise<ProjectContextRecord | null>;
  appendMemoryItem(record: Omit<MemoryItemRecord, 'createdAt'> & { createdAt?: string }): Promise<boolean>;
  backupTo(destinationPath: string): Promise<boolean>;
}

function memoryKey(userId: string, sessionId: string): string {
  return `mem:${userId}:${sessionId}`;
}

function nowIso(now: () => Date): string {
  return now().toISOString();
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

async function loadNodeSqlite(): Promise<typeof import('node:sqlite')> {
  return import('node:sqlite');
}

async function ensureDirectory(filePath: string): Promise<void> {
  if (filePath === ':memory:') {
    return;
  }

  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function copyDatabase(sourcePath: string, destinationPath: string): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
}

class SqliteNqitaMemoryStore implements NqitaMemoryStore {
  private readonly path: string;
  private readonly now: () => Date;
  private db: DatabaseSync | null = null;
  private degraded = false;
  private lastError: string | null = null;

  constructor(options: OpenNqitaMemoryOptions) {
    this.path = options.path;
    this.now = options.now ?? (() => new Date());
  }

  async initialize(): Promise<void> {
    try {
      await ensureDirectory(this.path);
      const { DatabaseSync } = await loadNodeSqlite();
      this.db = new DatabaseSync(this.path);
      this.db.exec(SCHEMA_SQL);
      this.degraded = false;
      this.lastError = null;
    } catch (error) {
      this.db = null;
      this.degraded = true;
      this.lastError = error instanceof Error ? error.message : 'unknown sqlite initialization failure';
    }
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }

  getStatus(): MemoryStatus {
    return {
      degraded: this.degraded,
      available: this.db !== null && !this.degraded,
      path: this.path,
      lastError: this.lastError,
    };
  }

  async getLatestStateSnapshot(): Promise<NqitaStateSnapshot | null> {
    return this.runRead(() => {
      const row = this.db!
        .prepare('SELECT state_json FROM state_log ORDER BY created_at DESC, id DESC LIMIT 1')
        .get() as { state_json: string } | undefined;
      return row ? parseJson<NqitaStateSnapshot>(row.state_json) : null;
    }, null);
  }

  async appendStateLog(snapshot: NqitaStateSnapshot, id = createId()): Promise<boolean> {
    return this.runWrite(() => {
      this.db!
        .prepare('INSERT INTO state_log (id, state_json, created_at) VALUES (?, ?, ?)')
        .run(id, JSON.stringify(snapshot), nowIso(this.now));
    });
  }

  async readStateLog(limit = 10): Promise<NqitaStateSnapshot[]> {
    return this.runRead(() => {
      const rows = this.db!
        .prepare('SELECT state_json FROM state_log ORDER BY created_at DESC, id DESC LIMIT ?')
        .all(limit) as Array<{ state_json: string }>;
      return rows.map((row) => parseJson<NqitaStateSnapshot>(row.state_json));
    }, []);
  }

  async setIdentity<T>(key: string, value: T): Promise<boolean> {
    return this.runWrite(() => {
      this.db!
        .prepare(`
          INSERT INTO identity_store (key, value_json, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
        `)
        .run(key, JSON.stringify(value), nowIso(this.now));
    });
  }

  async getIdentity<T>(key: string): Promise<T | null> {
    return this.runRead(() => {
      const row = this.db!
        .prepare('SELECT value_json FROM identity_store WHERE key = ?')
        .get(key) as { value_json: string } | undefined;
      return row ? parseJson<T>(row.value_json) : null;
    }, null);
  }

  async setUserPreference<T>(key: string, value: T): Promise<boolean> {
    return this.runWrite(() => {
      this.db!
        .prepare(`
          INSERT INTO user_preferences (key, value_json, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
        `)
        .run(key, JSON.stringify(value), nowIso(this.now));
    });
  }

  async getUserPreference<T>(key: string): Promise<T | null> {
    return this.runRead(() => {
      const row = this.db!
        .prepare('SELECT value_json FROM user_preferences WHERE key = ?')
        .get(key) as { value_json: string } | undefined;
      return row ? parseJson<T>(row.value_json) : null;
    }, null);
  }

  async upsertProjectContext(record: Omit<ProjectContextRecord, 'updatedAt'>): Promise<boolean> {
    return this.runWrite(() => {
      this.db!
        .prepare(`
          INSERT INTO project_context (project_id, summary, metadata_json, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(project_id) DO UPDATE SET
            summary = excluded.summary,
            metadata_json = excluded.metadata_json,
            updated_at = excluded.updated_at
        `)
        .run(record.projectId, record.summary, JSON.stringify(record.metadata), nowIso(this.now));
    });
  }

  async getProjectContext(projectId: string): Promise<ProjectContextRecord | null> {
    return this.runRead(() => {
      const row = this.db!
        .prepare('SELECT project_id, summary, metadata_json, updated_at FROM project_context WHERE project_id = ?')
        .get(projectId) as
        | { project_id: string; summary: string; metadata_json: string; updated_at: string }
        | undefined;

      return row
        ? {
            projectId: row.project_id,
            summary: row.summary,
            metadata: parseJson<Record<string, unknown>>(row.metadata_json),
            updatedAt: row.updated_at,
          }
        : null;
    }, null);
  }

  async appendMemoryItem(record: Omit<MemoryItemRecord, 'createdAt'> & { createdAt?: string }): Promise<boolean> {
    return this.runWrite(() => {
      this.db!
        .prepare(`
          INSERT INTO memory_items (id, memory_class, content, metadata_json, embedding_ref, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(
          record.id,
          record.memoryClass,
          record.content,
          JSON.stringify(record.metadata),
          record.embeddingRef,
          record.createdAt ?? nowIso(this.now)
        );
    });
  }

  async backupTo(destinationPath: string): Promise<boolean> {
    return this.runWrite(async () => {
      if (this.path === ':memory:') {
        throw new Error('in-memory databases require a file-backed store before backup');
      }

      await copyDatabase(this.path, destinationPath);
    });
  }

  private async runRead<T>(operation: () => T, fallback: T): Promise<T> {
    if (!this.db) {
      this.degraded = true;
      return fallback;
    }

    try {
      return operation();
    } catch (error) {
      this.degraded = true;
      this.lastError = error instanceof Error ? error.message : 'unknown sqlite read failure';
      return fallback;
    }
  }

  private async runWrite(operation: (() => void) | (() => Promise<void>)): Promise<boolean> {
    if (!this.db) {
      this.degraded = true;
      return false;
    }

    try {
      await operation();
      return true;
    } catch (error) {
      this.degraded = true;
      this.lastError = error instanceof Error ? error.message : 'unknown sqlite write failure';
      return false;
    }
  }
}

class DegradedNqitaMemoryStore implements NqitaMemoryStore {
  private readonly path: string;
  private readonly lastError: string;

  constructor(path: string, lastError: string) {
    this.path = path;
    this.lastError = lastError;
  }

  async initialize(): Promise<void> {}
  async close(): Promise<void> {}

  getStatus(): MemoryStatus {
    return {
      degraded: true,
      available: false,
      path: this.path,
      lastError: this.lastError,
    };
  }

  async getLatestStateSnapshot(): Promise<NqitaStateSnapshot | null> { return null; }
  async appendStateLog(): Promise<boolean> { return false; }
  async readStateLog(): Promise<NqitaStateSnapshot[]> { return []; }
  async setIdentity(): Promise<boolean> { return false; }
  async getIdentity<T>(): Promise<T | null> { return null; }
  async setUserPreference(): Promise<boolean> { return false; }
  async getUserPreference<T>(): Promise<T | null> { return null; }
  async upsertProjectContext(): Promise<boolean> { return false; }
  async getProjectContext(): Promise<ProjectContextRecord | null> { return null; }
  async appendMemoryItem(): Promise<boolean> { return false; }
  async backupTo(): Promise<boolean> { return false; }
}

export async function openNqitaMemoryStore(options: OpenNqitaMemoryOptions): Promise<NqitaMemoryStore> {
  const store = new SqliteNqitaMemoryStore(options);
  await store.initialize();

  if (store.getStatus().degraded) {
    return new DegradedNqitaMemoryStore(options.path, store.getStatus().lastError ?? 'unknown sqlite failure');
  }

  return store;
}

export function getCanonicalMemoryTables(): readonly string[] {
  return CANONICAL_TABLES;
}

export async function createDaemonRestoreStateHook(
  store: Pick<NqitaMemoryStore, 'getLatestStateSnapshot'>
): Promise<() => Promise<NqitaStateSnapshot | void>> {
  return async () => {
    const snapshot = await store.getLatestStateSnapshot();
    return snapshot ?? undefined;
  };
}

export async function getMemory(
  kv: KVNamespace | undefined,
  userId: string,
  sessionId: string
): Promise<Message[]> {
  if (!kv) return [];
  try {
    const raw = await kv.get(memoryKey(userId, sessionId));
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export async function appendMemory(
  kv: KVNamespace | undefined,
  userId: string,
  sessionId: string,
  newMessages: Message[]
): Promise<void> {
  if (!kv) return;
  try {
    const existing = await getMemory(kv, userId, sessionId);
    const updated = [...existing, ...newMessages].slice(-MAX_MESSAGES);
    await kv.put(memoryKey(userId, sessionId), JSON.stringify(updated), {
      expirationTtl: TTL_SECONDS,
    });
  } catch {
    // Non-fatal — legacy session memory remains best-effort.
  }
}

export async function clearMemory(
  kv: KVNamespace | undefined,
  userId: string,
  sessionId: string
): Promise<void> {
  if (!kv) return;
  try {
    await kv.delete(memoryKey(userId, sessionId));
  } catch {
    // Non-fatal.
  }
}

export async function listSessions(
  kv: KVNamespace | undefined,
  userId: string
): Promise<string[]> {
  if (!kv) return [];
  try {
    const list = await kv.list({ prefix: `mem:${userId}:` });
    return list.keys.map((k: { name: string }) => k.name.replace(`mem:${userId}:`, ''));
  } catch {
    return [];
  }
}
