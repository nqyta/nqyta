import { describe, expect, it } from 'vitest';
import {
  createNqitaStateStore,
  resolveAnimationId,
  resolveSceneId,
} from './state-engine';

describe('state engine', () => {
  it('supports idle, thinking, and coding transitions with derived scene and animation', () => {
    const store = createNqitaStateStore();

    expect(store.getState().task).toBe('idle');
    expect(store.getState().sceneId).toBe('idle_corner');
    expect(store.getState().animationId).toBe('idle_a');

    const thinking = store.dispatch({ task: 'thinking', mood: 'focused' });
    expect(thinking.task).toBe('thinking');
    expect(thinking.sceneId).toBe('idle_corner');
    expect(thinking.animationId).toBe('curious');

    const coding = store.dispatch({ task: 'coding', attentionTarget: 'terminal' });
    expect(coding.task).toBe('coding');
    expect(coding.sceneId).toBe('desk_terminal');
    expect(coding.animationId).toBe('researching');
  });

  it('gives error precedence over non-safety visuals and preserves read-only visibility flags', () => {
    const store = createNqitaStateStore();

    store.dispatch({ task: 'coding', attentionTarget: 'terminal', privacyMode: 'read_only' });
    const errored = store.dispatch({ task: 'error', mood: 'concerned' });

    expect(errored.task).toBe('error');
    expect(errored.sceneId).toBe('alert_overlay');
    expect(errored.animationId).toBe('reaction');
    expect(errored.flags).toContain('read_only');
    expect(errored.isVisible).toBe(true);
  });

  it('suppresses rapid scene changes with hysteresis', () => {
    let now = 0;
    const store = createNqitaStateStore({}, {
      now: () => now,
      sceneHysteresisMs: 1000,
    });

    const first = store.dispatch({ task: 'thinking' });

    now = 100;
    const second = store.dispatch({ task: 'coding', attentionTarget: 'terminal' });

    expect(first.sceneId).toBe('idle_corner');
    expect(second.task).toBe('coding');
    expect(second.sceneId).toBe('idle_corner');
    expect(second.animationId).toBe('curious');
  });

  it('suppresses ambient animation churn inside the same scene with animation cooldown', () => {
    let now = 0;
    const randomValues = [0.0, 0.99, 0.99];
    const random = () => randomValues.shift() ?? 0.99;
    const store = createNqitaStateStore({}, {
      now: () => now,
      random,
      enableAmbientVariation: true,
      animationCooldownMs: 1000,
    });

    const initial = store.dispatch({ task: 'idle' });
    expect(initial.animationId).toBe('idle_a');

    now = 100;
    const blocked = store.dispatch({ intensity: 0.2 });
    expect(blocked.sceneId).toBe('idle_corner');
    expect(blocked.animationId).toBe('idle_a');

    now = 1200;
    const advanced = store.dispatch({ intensity: 0.4 });
    expect(advanced.sceneId).toBe('idle_corner');
    expect(advanced.animationId).toBe('idle_d');
  });

  it('falls back into degraded idle presentation when an unknown task is received', () => {
    const store = createNqitaStateStore();

    const degraded = store.dispatch({ task: 'unknown_task' });

    expect(degraded.sceneId).toBe('idle_corner');
    expect(degraded.animationId).toBe('idle_a');
    expect(degraded.flags).toContain('degraded');
    expect(degraded.task).toBe('idle');
  });

  it('exports deterministic mapping helpers for daemon and renderer consumers', () => {
    expect(resolveSceneId('browsing')).toBe('desk_browser');
    expect(resolveAnimationId('sleeping')).toBe('sleeping');
  });
});
