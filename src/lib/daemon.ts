import {
  createInitialSnapshot,
  createNqitaStateStore,
  type NqitaAttentionTarget,
  type NqitaState,
  type NqitaStateSnapshot,
  type NqitaStateStore,
  type NqitaStateUpdate,
  type NqitaUrgency,
} from './state-engine';

export type DaemonLifecycle = 'stopped' | 'booting' | 'running' | 'shutting_down';
export type DaemonPhase = 'observe' | 'decide' | 'act' | 'reflect';

export interface ObservationEvent {
  source: string;
  attentionTarget?: NqitaAttentionTarget;
  urgency?: NqitaUrgency;
}

export interface WindowsObservationProvider {
  name: string;
  start(): Promise<void> | void;
  observe(): Promise<ObservationEvent[]> | ObservationEvent[];
  stop(): Promise<void> | void;
}

export interface DaemonReadyMessage {
  type: 'ready';
  timestamp: number;
  degraded: boolean;
  state: NqitaState;
}

export interface DaemonHeartbeatMessage {
  type: 'heartbeat';
  timestamp: number;
  lifecycle: DaemonLifecycle;
  degraded: boolean;
  activeObserverCount: number;
  state: NqitaState;
}

export interface DaemonStatusMessage {
  type: 'status';
  timestamp: number;
  lifecycle: DaemonLifecycle;
  degraded: boolean;
  state: NqitaState;
}

export type DaemonIpcMessage = DaemonReadyMessage | DaemonHeartbeatMessage | DaemonStatusMessage;

export interface DaemonIpcTransport {
  emit(message: DaemonIpcMessage): void;
}

export interface DaemonTimers {
  setInterval(handler: () => void, intervalMs: number): ReturnType<typeof setInterval>;
  clearInterval(handle: ReturnType<typeof setInterval>): void;
}

export interface DaemonHooks {
  onPhase?(phase: DaemonPhase): void;
}

export interface DaemonOptions {
  now?: () => number;
  timers?: DaemonTimers;
  ipc?: DaemonIpcTransport;
  observationProviders?: WindowsObservationProvider[];
  restoreState?: () => Promise<Partial<NqitaState> | NqitaStateSnapshot | void> | Partial<NqitaState> | NqitaStateSnapshot | void;
  loopIntervalMs?: number;
  heartbeatIntervalMs?: number;
  maxObservationEvents?: number;
  stateStore?: NqitaStateStore;
  stateEngine?: {
    now?: () => number;
    sceneHysteresisMs?: number;
    animationCooldownMs?: number;
    enableAmbientVariation?: boolean;
    random?: () => number;
  };
  hooks?: DaemonHooks;
}

export interface DaemonStatus {
  lifecycle: DaemonLifecycle;
  degraded: boolean;
  activeObserverCount: number;
  lastHeartbeatAt: number | null;
  state: NqitaState;
}

const DEFAULT_LOOP_INTERVAL_MS = 1000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 1000;
const DEFAULT_MAX_OBSERVATION_EVENTS = 10;

function isSnapshot(value: unknown): value is NqitaStateSnapshot {
  return typeof value === 'object'
    && value !== null
    && 'state' in value
    && 'lastSceneChangeAt' in value
    && 'lastAnimationChangeAt' in value;
}

function createNoopIpc(): DaemonIpcTransport {
  return {
    emit() {
      // Intentionally empty for no-op/degraded operation.
    },
  };
}

function createDefaultTimers(): DaemonTimers {
  return {
    setInterval(handler, intervalMs) {
      return globalThis.setInterval(handler, intervalMs);
    },
    clearInterval(handle) {
      globalThis.clearInterval(handle);
    },
  };
}

export function createStubWindowsObservationProvider(name = 'windows_stub'): WindowsObservationProvider {
  return {
    name,
    start() {
      // Staged implementation: event-first Windows hooks are not active yet.
    },
    observe() {
      return [];
    },
    stop() {
      // No-op for the staged stub.
    },
  };
}

export class NqitaDaemon {
  private readonly now: () => number;
  private readonly timers: DaemonTimers;
  private readonly ipc: DaemonIpcTransport;
  private readonly providers: WindowsObservationProvider[];
  private readonly restoreState?: DaemonOptions['restoreState'];
  private readonly loopIntervalMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly maxObservationEvents: number;
  private readonly hooks?: DaemonHooks;
  private readonly stateStore: NqitaStateStore;

  private lifecycle: DaemonLifecycle = 'stopped';
  private degraded = false;
  private lastHeartbeatAt: number | null = null;
  private loopHandle: ReturnType<typeof setInterval> | null = null;
  private heartbeatHandle: ReturnType<typeof setInterval> | null = null;

  constructor(options: DaemonOptions = {}) {
    this.now = options.now ?? Date.now;
    this.timers = options.timers ?? createDefaultTimers();
    this.ipc = options.ipc ?? createNoopIpc();
    this.providers = options.observationProviders ?? [];
    this.restoreState = options.restoreState;
    this.loopIntervalMs = options.loopIntervalMs ?? DEFAULT_LOOP_INTERVAL_MS;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.maxObservationEvents = options.maxObservationEvents ?? DEFAULT_MAX_OBSERVATION_EVENTS;
    this.hooks = options.hooks;
    this.stateStore = options.stateStore ?? createNqitaStateStore({}, {
      now: options.stateEngine?.now ?? this.now,
      sceneHysteresisMs: options.stateEngine?.sceneHysteresisMs,
      animationCooldownMs: options.stateEngine?.animationCooldownMs,
      enableAmbientVariation: options.stateEngine?.enableAmbientVariation,
      random: options.stateEngine?.random,
    });
  }

  async boot(): Promise<DaemonStatus> {
    this.lifecycle = 'booting';

    const restored = this.restoreState ? await this.restoreState() : undefined;
    if (restored) {
      if (isSnapshot(restored)) {
        this.stateStore.replace(restored);
      } else {
        this.stateStore.replace(createInitialSnapshot(restored));
      }
    }

    let activeProviders = 0;
    for (const provider of this.providers) {
      try {
        await provider.start();
        activeProviders += 1;
      } catch {
        this.degraded = true;
      }
    }

    if (activeProviders === 0) {
      this.degraded = true;
    }

    this.lifecycle = 'running';
    this.emit({
      type: 'ready',
      timestamp: this.now(),
      degraded: this.degraded,
      state: this.stateStore.getState(),
    });

    return this.getStatus();
  }

  run(): void {
    if (this.lifecycle !== 'running') {
      throw new Error('Daemon must be booted before run()');
    }

    if (!this.loopHandle) {
      this.loopHandle = this.timers.setInterval(() => {
        void this.runCycle();
      }, this.loopIntervalMs);
    }

    if (!this.heartbeatHandle) {
      this.heartbeatHandle = this.timers.setInterval(() => {
        this.emitHeartbeat();
      }, this.heartbeatIntervalMs);
    }
  }

  async runCycle(): Promise<NqitaState> {
    this.hooks?.onPhase?.('observe');
    const observations = await this.observe();

    this.hooks?.onPhase?.('decide');
    const update = this.decide(observations);

    this.hooks?.onPhase?.('act');
    const state = this.act(update);

    this.hooks?.onPhase?.('reflect');
    this.reflect();

    return state;
  }

  emitHeartbeat(): DaemonHeartbeatMessage {
    const message: DaemonHeartbeatMessage = {
      type: 'heartbeat',
      timestamp: this.now(),
      lifecycle: this.lifecycle,
      degraded: this.degraded,
      activeObserverCount: this.providers.length,
      state: this.stateStore.getState(),
    };

    this.lastHeartbeatAt = message.timestamp;
    this.emit(message);
    return message;
  }

  async shutdown(): Promise<DaemonStatus> {
    this.lifecycle = 'shutting_down';

    if (this.loopHandle) {
      this.timers.clearInterval(this.loopHandle);
      this.loopHandle = null;
    }

    if (this.heartbeatHandle) {
      this.timers.clearInterval(this.heartbeatHandle);
      this.heartbeatHandle = null;
    }

    for (const provider of this.providers) {
      await provider.stop();
    }

    this.lifecycle = 'stopped';
    this.emit({
      type: 'status',
      timestamp: this.now(),
      lifecycle: this.lifecycle,
      degraded: this.degraded,
      state: this.stateStore.getState(),
    });

    return this.getStatus();
  }

  getStatus(): DaemonStatus {
    return {
      lifecycle: this.lifecycle,
      degraded: this.degraded,
      activeObserverCount: this.providers.length,
      lastHeartbeatAt: this.lastHeartbeatAt,
      state: this.stateStore.getState(),
    };
  }

  private async observe(): Promise<ObservationEvent[]> {
    const events: ObservationEvent[] = [];

    for (const provider of this.providers) {
      try {
        const observed = await provider.observe();
        for (const event of observed) {
          events.push(event);
          if (events.length >= this.maxObservationEvents) {
            return events;
          }
        }
      } catch {
        this.degraded = true;
      }
    }

    if (this.providers.length === 0) {
      this.degraded = true;
    }

    return events;
  }

  private decide(events: ObservationEvent[]): NqitaStateUpdate {
    if (events.length === 0) {
      return {
        task: 'idle',
        attentionTarget: 'none',
        mood: this.degraded ? 'concerned' : 'calm',
        flags: this.degraded ? ['degraded'] : [],
      };
    }

    const first = events[0];
    return {
      task: 'observing',
      attentionTarget: first.attentionTarget ?? 'window',
      urgency: first.urgency ?? 'low',
      mood: 'focused',
      intensity: 0.25,
      flags: this.degraded ? ['degraded'] : [],
    };
  }

  private act(update: NqitaStateUpdate): NqitaState {
    const state = this.stateStore.dispatch(update);

    if (this.degraded && !state.flags.includes('degraded')) {
      const snapshot = this.stateStore.getSnapshot();
      this.stateStore.replace({
        ...snapshot,
        state: {
          ...snapshot.state,
          flags: [...snapshot.state.flags, 'degraded'],
        },
      });
      return this.stateStore.getState();
    }

    return state;
  }

  private reflect(): void {
    this.emit({
      type: 'status',
      timestamp: this.now(),
      lifecycle: this.lifecycle,
      degraded: this.degraded,
      state: this.stateStore.getState(),
    });
  }

  private emit(message: DaemonIpcMessage): void {
    this.ipc.emit(message);
  }
}

export function createNqitaDaemon(options: DaemonOptions = {}): NqitaDaemon {
  return new NqitaDaemon(options);
}
