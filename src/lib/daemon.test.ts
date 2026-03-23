import { describe, expect, it, vi } from 'vitest';
import { createInitialSnapshot, type NqitaStateSnapshot } from './state-engine';
import {
  createNqitaDaemon,
  createStubWindowsObservationProvider,
  type DaemonIpcMessage,
  type DaemonTimers,
  type ObservationEvent,
  type WindowsObservationProvider,
} from './daemon';

function createProvider(events: ObservationEvent[] = []): WindowsObservationProvider {
  return {
    name: 'provider',
    start: vi.fn(),
    observe: vi.fn().mockResolvedValue(events),
    stop: vi.fn(),
  };
}

describe('daemon skeleton', () => {
  it('boots and shuts down with explicit lifecycle transitions', async () => {
    const provider = createProvider();
    const messages: DaemonIpcMessage[] = [];
    const daemon = createNqitaDaemon({
      ipc: { emit: (message) => messages.push(message) },
      observationProviders: [provider],
    });

    const bootStatus = await daemon.boot();
    expect(bootStatus.lifecycle).toBe('running');
    expect(provider.start).toHaveBeenCalledTimes(1);
    expect(messages[0]?.type).toBe('ready');

    const shutdownStatus = await daemon.shutdown();
    expect(shutdownStatus.lifecycle).toBe('stopped');
    expect(provider.stop).toHaveBeenCalledTimes(1);
    expect(messages.at(-1)?.type).toBe('status');
  });

  it('emits heartbeat messages suitable for an overlay consumer', async () => {
    const messages: DaemonIpcMessage[] = [];
    const daemon = createNqitaDaemon({
      ipc: { emit: (message) => messages.push(message) },
      observationProviders: [createProvider()],
    });

    await daemon.boot();
    const heartbeat = daemon.emitHeartbeat();

    expect(heartbeat.type).toBe('heartbeat');
    expect(heartbeat.lifecycle).toBe('running');
    expect(heartbeat.state.sceneId).toBe('idle_corner');
    expect(messages.at(-1)).toEqual(heartbeat);
  });

  it('stays alive in degraded no-op mode when no observation providers are active', async () => {
    const daemon = createNqitaDaemon();

    const bootStatus = await daemon.boot();
    expect(bootStatus.degraded).toBe(true);

    const state = await daemon.runCycle();
    expect(state.task).toBe('idle');
    expect(state.flags).toContain('degraded');
    expect(daemon.getStatus().lifecycle).toBe('running');
  });

  it('executes loop phases in the documented order', async () => {
    const phases: string[] = [];
    const daemon = createNqitaDaemon({
      observationProviders: [createProvider()],
      hooks: {
        onPhase(phase) {
          phases.push(phase);
        },
      },
    });

    await daemon.boot();
    await daemon.runCycle();

    expect(phases).toEqual(['observe', 'decide', 'act', 'reflect']);
  });

  it('integrates with the state engine and derives observing presentation from events', async () => {
    const daemon = createNqitaDaemon({
      observationProviders: [createProvider([{ source: 'windows.focus', attentionTarget: 'terminal', urgency: 'medium' }])],
    });

    await daemon.boot();
    const state = await daemon.runCycle();

    expect(state.task).toBe('observing');
    expect(state.attentionTarget).toBe('terminal');
    expect(state.sceneId).toBe('idle_corner');
    expect(state.animationId).toBe('curious');
  });

  it('runs loop and heartbeat intervals after run()', async () => {
    vi.useFakeTimers();

    const messages: DaemonIpcMessage[] = [];
    const daemon = createNqitaDaemon({
      ipc: { emit: (message) => messages.push(message) },
      observationProviders: [createProvider()],
      loopIntervalMs: 50,
      heartbeatIntervalMs: 75,
    });

    await daemon.boot();
    daemon.run();
    await vi.advanceTimersByTimeAsync(200);

    expect(messages.some((message) => message.type === 'heartbeat')).toBe(true);
    expect(messages.filter((message) => message.type === 'status').length).toBeGreaterThan(0);

    await daemon.shutdown();
    vi.useRealTimers();
  });

  it('restores state snapshots before announcing readiness', async () => {
    const snapshot: NqitaStateSnapshot = {
      ...createInitialSnapshot({
        task: 'sleeping',
      }),
      lastSceneChangeAt: 100,
      lastAnimationChangeAt: 100,
    };

    const daemon = createNqitaDaemon({
      restoreState: () => snapshot,
      observationProviders: [createStubWindowsObservationProvider()],
    });

    const status = await daemon.boot();

    expect(status.state.task).toBe('sleeping');
    expect(status.state.animationId).toBe('sleeping');
  });
});
