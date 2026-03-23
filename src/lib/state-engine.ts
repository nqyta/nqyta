export type NqitaMode = 'PASSIVE' | 'ASSISTANT' | 'RESEARCH' | 'YOLO';
export type NqitaMood = 'calm' | 'focused' | 'happy' | 'concerned';
export type NqitaTask =
  | 'idle'
  | 'observing'
  | 'thinking'
  | 'coding'
  | 'browsing'
  | 'error'
  | 'sleeping';
export type NqitaAttentionTarget = 'none' | 'user' | 'window' | 'terminal' | 'browser';
export type NqitaUrgency = 'low' | 'medium' | 'high';
export type NqitaPrivacyMode = 'normal' | 'muted' | 'read_only';

export interface NqitaState {
  mode: NqitaMode;
  mood: NqitaMood;
  task: NqitaTask;
  attentionTarget: NqitaAttentionTarget;
  intensity: number;
  urgency: NqitaUrgency;
  privacyMode: NqitaPrivacyMode;
  isVisible: boolean;
  sceneId: string;
  animationId: string;
  flags: string[];
}

export interface NqitaStateSnapshot {
  state: NqitaState;
  lastSceneChangeAt: number | null;
  lastAnimationChangeAt: number | null;
}

export interface StateEngineOptions {
  now?: () => number;
  random?: () => number;
  sceneHysteresisMs?: number;
  animationCooldownMs?: number;
  enableAmbientVariation?: boolean;
}

export type NqitaStateUpdate = Partial<{
  mode: NqitaMode;
  mood: NqitaMood;
  task: NqitaTask | string;
  attentionTarget: NqitaAttentionTarget | string;
  intensity: number;
  urgency: NqitaUrgency;
  privacyMode: NqitaPrivacyMode | string;
  isVisible: boolean;
  flags: string[];
}>;

export interface NqitaStateStore {
  getState(): NqitaState;
  getSnapshot(): NqitaStateSnapshot;
  dispatch(update: NqitaStateUpdate): NqitaState;
  replace(state: NqitaStateSnapshot): void;
}

const IDLE_SCENE_ID = 'idle_corner';
const TERMINAL_SCENE_ID = 'desk_terminal';
const BROWSER_SCENE_ID = 'desk_browser';
const ALERT_SCENE_ID = 'alert_overlay';
const DEFAULT_IDLE_ANIMATION = 'idle_a';

const IDLE_ANIMATIONS = ['idle_a', 'idle_b', 'idle_c', 'idle_d'] as const;
const CODING_ANIMATIONS = ['researching', 'typing'] as const;

function isMode(value: string): value is NqitaMode {
  return value === 'PASSIVE' || value === 'ASSISTANT' || value === 'RESEARCH' || value === 'YOLO';
}

function isMood(value: string): value is NqitaMood {
  return value === 'calm' || value === 'focused' || value === 'happy' || value === 'concerned';
}

function isTask(value: string): value is NqitaTask {
  return value === 'idle'
    || value === 'observing'
    || value === 'thinking'
    || value === 'coding'
    || value === 'browsing'
    || value === 'error'
    || value === 'sleeping';
}

function isAttentionTarget(value: string): value is NqitaAttentionTarget {
  return value === 'none'
    || value === 'user'
    || value === 'window'
    || value === 'terminal'
    || value === 'browser';
}

function isUrgency(value: string): value is NqitaUrgency {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isPrivacyMode(value: string): value is NqitaPrivacyMode {
  return value === 'normal' || value === 'muted' || value === 'read_only';
}

function clampIntensity(intensity: number): number {
  if (Number.isNaN(intensity)) return 0;
  return Math.min(1, Math.max(0, intensity));
}

function chooseAnimation<T extends string>(
  options: readonly T[],
  enableAmbientVariation: boolean,
  random: () => number
): T {
  if (!enableAmbientVariation || options.length === 1) {
    return options[0];
  }

  const index = Math.min(options.length - 1, Math.floor(random() * options.length));
  return options[index];
}

function deriveSceneId(task: string): string {
  switch (task) {
    case 'idle':
    case 'thinking':
    case 'sleeping':
      return IDLE_SCENE_ID;
    case 'coding':
      return TERMINAL_SCENE_ID;
    case 'browsing':
      return BROWSER_SCENE_ID;
    case 'error':
      return ALERT_SCENE_ID;
    default:
      return IDLE_SCENE_ID;
  }
}

function deriveAnimationId(
  task: string,
  enableAmbientVariation: boolean,
  random: () => number
): string {
  switch (task) {
    case 'idle':
      return chooseAnimation(IDLE_ANIMATIONS, enableAmbientVariation, random);
    case 'thinking':
    case 'observing':
      return 'curious';
    case 'coding':
      return chooseAnimation(CODING_ANIMATIONS, enableAmbientVariation, random);
    case 'browsing':
      return 'researching';
    case 'error':
      return 'reaction';
    case 'sleeping':
      return 'sleeping';
    default:
      return DEFAULT_IDLE_ANIMATION;
  }
}

function normalizeFlags(flags: string[], privacyMode: NqitaPrivacyMode, degraded: boolean): string[] {
  const nextFlags = flags.filter((flag) => flag !== 'read_only' && flag !== 'degraded');

  if (privacyMode === 'read_only') {
    nextFlags.push('read_only');
  }

  if (degraded) {
    nextFlags.push('degraded');
  }

  return nextFlags;
}

function shouldApplySceneHysteresis(
  previous: NqitaStateSnapshot,
  nextSceneId: string,
  now: number,
  sceneHysteresisMs: number
): boolean {
  if (sceneHysteresisMs <= 0 || previous.lastSceneChangeAt === null) {
    return false;
  }

  return nextSceneId !== previous.state.sceneId && now - previous.lastSceneChangeAt < sceneHysteresisMs;
}

function shouldApplyAnimationCooldown(
  previous: NqitaStateSnapshot,
  nextSceneId: string,
  nextAnimationId: string,
  now: number,
  animationCooldownMs: number
): boolean {
  if (animationCooldownMs <= 0 || previous.lastAnimationChangeAt === null) {
    return false;
  }

  return nextSceneId === previous.state.sceneId
    && nextAnimationId !== previous.state.animationId
    && now - previous.lastAnimationChangeAt < animationCooldownMs;
}

function buildCandidateState(previous: NqitaState, update: NqitaStateUpdate): Omit<NqitaState, 'sceneId' | 'animationId'> {
  const mode = update.mode && isMode(update.mode) ? update.mode : previous.mode;
  const mood = update.mood && isMood(update.mood) ? update.mood : previous.mood;
  const task = update.task && isTask(update.task) ? update.task : previous.task;
  const attentionTarget = update.attentionTarget && isAttentionTarget(update.attentionTarget)
    ? update.attentionTarget
    : previous.attentionTarget;
  const urgency = update.urgency && isUrgency(update.urgency) ? update.urgency : previous.urgency;
  const privacyMode = update.privacyMode && isPrivacyMode(update.privacyMode)
    ? update.privacyMode
    : previous.privacyMode;
  const flags = update.flags ? [...update.flags] : [...previous.flags];

  return {
    mode,
    mood,
    task,
    attentionTarget,
    intensity: update.intensity === undefined ? previous.intensity : clampIntensity(update.intensity),
    urgency,
    privacyMode,
    isVisible: update.isVisible === undefined ? previous.isVisible : update.isVisible,
    flags,
  };
}

export function createInitialNqitaState(overrides: Partial<NqitaState> = {}): NqitaState {
  const baseTask = overrides.task ?? 'idle';
  const basePrivacyMode = overrides.privacyMode ?? 'normal';
  const baseFlags = overrides.flags ? [...overrides.flags] : [];
  const derived = resolveStatePresentation({
    task: baseTask,
    privacyMode: basePrivacyMode,
    flags: baseFlags,
  });

  return {
    mode: overrides.mode ?? 'PASSIVE',
    mood: overrides.mood ?? 'calm',
    task: baseTask,
    attentionTarget: overrides.attentionTarget ?? 'none',
    intensity: clampIntensity(overrides.intensity ?? 0),
    urgency: overrides.urgency ?? 'low',
    privacyMode: basePrivacyMode,
    isVisible: overrides.isVisible ?? true,
    sceneId: overrides.sceneId ?? derived.sceneId,
    animationId: overrides.animationId ?? derived.animationId,
    flags: normalizeFlags(baseFlags, basePrivacyMode, derived.flags.includes('degraded')),
  };
}

export function createInitialSnapshot(overrides: Partial<NqitaState> = {}): NqitaStateSnapshot {
  return {
    state: createInitialNqitaState(overrides),
    lastSceneChangeAt: null,
    lastAnimationChangeAt: null,
  };
}

export function resolveSceneId(task: NqitaTask | string): string {
  return deriveSceneId(task);
}

export function resolveAnimationId(
  task: NqitaTask | string,
  options: Pick<StateEngineOptions, 'enableAmbientVariation' | 'random'> = {}
): string {
  return deriveAnimationId(task, options.enableAmbientVariation ?? false, options.random ?? Math.random);
}

export function resolveStatePresentation(
  state: Pick<NqitaState, 'task' | 'privacyMode' | 'flags'>,
  options: Pick<StateEngineOptions, 'enableAmbientVariation' | 'random'> = {}
): Pick<NqitaState, 'sceneId' | 'animationId' | 'flags'> {
  const sceneId = deriveSceneId(state.task);
  const animationId = deriveAnimationId(state.task, options.enableAmbientVariation ?? false, options.random ?? Math.random);
  const degraded = !isTask(state.task);

  return {
    sceneId,
    animationId,
    flags: normalizeFlags(state.flags, state.privacyMode, degraded),
  };
}

export function reduceNqitaState(
  previous: NqitaStateSnapshot,
  update: NqitaStateUpdate,
  options: StateEngineOptions = {}
): NqitaStateSnapshot {
  const now = options.now ? options.now() : Date.now();
  const random = options.random ?? Math.random;
  const enableAmbientVariation = options.enableAmbientVariation ?? false;
  const sceneHysteresisMs = options.sceneHysteresisMs ?? 0;
  const animationCooldownMs = options.animationCooldownMs ?? 0;

  const candidate = buildCandidateState(previous.state, update);
  const derivedTask = update.task ?? candidate.task;
  const degraded = !isTask(String(derivedTask));
  const effectiveTask: NqitaTask = candidate.task === 'error' ? 'error' : candidate.task;

  const resolvedSceneId = deriveSceneId(derivedTask ?? effectiveTask);
  const resolvedAnimationId = candidate.task === 'error'
    ? 'reaction'
    : deriveAnimationId(derivedTask ?? effectiveTask, enableAmbientVariation, random);
  const resolvedFlags = normalizeFlags(candidate.flags, candidate.privacyMode, degraded);

  let sceneId = resolvedSceneId;
  let animationId = resolvedAnimationId;
  let lastSceneChangeAt = previous.lastSceneChangeAt;
  let lastAnimationChangeAt = previous.lastAnimationChangeAt;

  if (candidate.task !== 'error' && shouldApplySceneHysteresis(previous, sceneId, now, sceneHysteresisMs)) {
    sceneId = previous.state.sceneId;
    animationId = previous.state.animationId;
  }

  if (
    candidate.task !== 'error'
    && shouldApplyAnimationCooldown(previous, sceneId, animationId, now, animationCooldownMs)
  ) {
    animationId = previous.state.animationId;
  }

  if (sceneId !== previous.state.sceneId) {
    lastSceneChangeAt = now;
  }

  if (animationId !== previous.state.animationId) {
    lastAnimationChangeAt = now;
  }

  return {
    state: {
      ...candidate,
      task: effectiveTask,
      sceneId,
      animationId,
      flags: resolvedFlags,
    },
    lastSceneChangeAt,
    lastAnimationChangeAt,
  };
}

export function createNqitaStateStore(
  initial: Partial<NqitaState> = {},
  options: StateEngineOptions = {}
): NqitaStateStore {
  const initialTimestamp = options.now ? options.now() : null;
  let snapshot: NqitaStateSnapshot = {
    ...createInitialSnapshot(initial),
    lastSceneChangeAt: initialTimestamp,
    lastAnimationChangeAt: initialTimestamp,
  };

  return {
    getState() {
      return snapshot.state;
    },
    getSnapshot() {
      return snapshot;
    },
    dispatch(update) {
      snapshot = reduceNqitaState(snapshot, update, options);
      return snapshot.state;
    },
    replace(nextSnapshot) {
      snapshot = {
        state: {
          ...nextSnapshot.state,
          flags: [...nextSnapshot.state.flags],
        },
        lastSceneChangeAt: nextSnapshot.lastSceneChangeAt,
        lastAnimationChangeAt: nextSnapshot.lastAnimationChangeAt,
      };
    },
  };
}
