import { describe, expect, it } from 'vitest';
import type { DaemonStatusMessage } from './daemon';
import {
  buildOverlayUpdateFromDaemonMessage,
  CANONICAL_LAYER_ORDER,
  createEmbodimentPlaceholder,
  EMBODIMENT_RENDER_RULES,
} from './embodiment';
import { createInitialNqitaState } from './state-engine';

function createMessage(overrides: Partial<DaemonStatusMessage> = {}): DaemonStatusMessage {
  return {
    type: 'status',
    timestamp: 100,
    lifecycle: 'running',
    degraded: false,
    state: createInitialNqitaState(),
    ...overrides,
  };
}

describe('embodiment placeholder', () => {
  it('maps daemon IPC messages into canonical overlay updates', () => {
    const message = createMessage({
      timestamp: 42,
      state: createInitialNqitaState({
        task: 'thinking',
        sceneId: 'idle_corner',
        animationId: 'curious',
      }),
    });

    const update = buildOverlayUpdateFromDaemonMessage(message);

    expect(update.stateId).toBe('status:42:idle_corner:curious');
    expect(update.sceneId).toBe('idle_corner');
    expect(update.animationId).toBe('curious');
    expect(update.visible).toBe(true);
    expect(update.flags).toEqual([]);
    expect(update.deviceSurface).toBeUndefined();
  });

  it('infers placeholder device surfaces for desk scenes', () => {
    const terminalUpdate = buildOverlayUpdateFromDaemonMessage(createMessage({
      state: createInitialNqitaState({
        task: 'coding',
        sceneId: 'desk_terminal',
        animationId: 'researching',
      }),
    }));

    const browserUpdate = buildOverlayUpdateFromDaemonMessage(createMessage({
      state: createInitialNqitaState({
        task: 'browsing',
        sceneId: 'desk_browser',
        animationId: 'researching',
      }),
    }));

    expect(terminalUpdate.deviceSurface).toEqual({
      kind: 'terminal',
      contentRef: 'placeholder://terminal',
    });
    expect(browserUpdate.deviceSurface).toEqual({
      kind: 'browser',
      contentRef: 'placeholder://browser',
    });
  });

  it('retains the last valid overlay update and marks it degraded when IPC is lost', () => {
    const placeholder = createEmbodimentPlaceholder();
    placeholder.consume(createMessage({
      state: createInitialNqitaState({
        task: 'coding',
        sceneId: 'desk_terminal',
        animationId: 'typing',
      }),
    }));

    const disconnected = placeholder.markIpcDisconnected();

    expect(disconnected?.sceneId).toBe('desk_terminal');
    expect(disconnected?.animationId).toBe('typing');
    expect(disconnected?.flags).toContain('degraded');
  });

  it('preserves degraded mode from daemon messages', () => {
    const update = buildOverlayUpdateFromDaemonMessage(createMessage({
      degraded: true,
      state: createInitialNqitaState({
        privacyMode: 'read_only',
      }),
    }));

    expect(update.flags).toEqual(['read_only', 'degraded']);
  });

  it('exports canonical layer order and render defaults', () => {
    expect(CANONICAL_LAYER_ORDER).toEqual([
      'background',
      'props',
      'body',
      'accessories',
      'device screens',
      'effects',
      'UI',
    ]);
    expect(EMBODIMENT_RENDER_RULES.scaling).toBe('nearest-neighbor');
    expect(EMBODIMENT_RENDER_RULES.clickThroughDefault).toBe(true);
  });
});
