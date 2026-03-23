import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { createNqitaDaemon } from './daemon';
import { createInitialSnapshot } from './state-engine';
import {
  createDaemonRestoreStateHook,
  getCanonicalMemoryTables,
  openNqitaMemoryStore,
} from './memory';

const tempRoots: string[] = [];

async function createTempPath(filename: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'nqita-memory-'));
  tempRoots.push(dir);
  return join(dir, filename);
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('sqlite memory layer', () => {
  it('initializes the canonical schema tables', async () => {
    const dbPath = await createTempPath('nqita.db');
    const store = await openNqitaMemoryStore({ path: dbPath });
    const db = new DatabaseSync(dbPath);

    const rows = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `).all() as Array<{ name: string }>;

    expect(rows.map((row) => row.name)).toEqual(expect.arrayContaining([...getCanonicalMemoryTables()]));

    db.close();
    await store.close();
  });

  it('writes and reads identity values', async () => {
    const store = await openNqitaMemoryStore({ path: await createTempPath('identity.db') });

    const saved = await store.setIdentity('nqita.self', { name: 'Nqita', role: 'system agent' });
    const loaded = await store.getIdentity<{ name: string; role: string }>('nqita.self');

    expect(saved).toBe(true);
    expect(loaded).toEqual({ name: 'Nqita', role: 'system agent' });

    await store.close();
  });

  it('appends and restores state log snapshots', async () => {
    const store = await openNqitaMemoryStore({ path: await createTempPath('state.db') });
    const snapshot = createInitialSnapshot({
      task: 'sleeping',
      mood: 'calm',
    });

    const written = await store.appendStateLog(snapshot, 'state-1');
    const recent = await store.readStateLog(5);
    const restored = await store.getLatestStateSnapshot();

    expect(written).toBe(true);
    expect(recent).toHaveLength(1);
    expect(recent[0]?.state.task).toBe('sleeping');
    expect(restored?.state.animationId).toBe('sleeping');

    await store.close();
  });

  it('degrades safely when sqlite open fails', async () => {
    const badPath = await mkdtemp(join(tmpdir(), 'nqita-memory-dir-'));
    tempRoots.push(badPath);
    await mkdir(join(badPath, 'nested'), { recursive: true });

    const store = await openNqitaMemoryStore({ path: badPath });

    expect(store.getStatus().degraded).toBe(true);
    expect(await store.setIdentity('x', { ok: true })).toBe(false);
    expect(await store.getLatestStateSnapshot()).toBeNull();
  });

  it('supports daemon restore hook compatibility', async () => {
    const store = await openNqitaMemoryStore({ path: await createTempPath('daemon.db') });
    await store.appendStateLog(createInitialSnapshot({ task: 'sleeping' }), 'restore-1');

    const daemon = createNqitaDaemon({
      restoreState: await createDaemonRestoreStateHook(store),
    });

    const status = await daemon.boot();

    expect(status.state.task).toBe('sleeping');
    expect(status.state.animationId).toBe('sleeping');

    await daemon.shutdown();
    await store.close();
  });
});
