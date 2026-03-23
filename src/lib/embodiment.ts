import type { DaemonIpcMessage } from './daemon';

export interface OverlayUpdate {
  stateId: string;
  sceneId: string;
  animationId: string;
  visible: boolean;
  bubbleText?: string;
  flags: string[];
  deviceSurface?: {
    kind: 'terminal' | 'browser';
    contentRef: string;
  };
}

export const CANONICAL_LAYER_ORDER = [
  'background',
  'props',
  'body',
  'accessories',
  'device screens',
  'effects',
  'UI',
] as const;

export const EMBODIMENT_RENDER_RULES = {
  scaling: 'nearest-neighbor',
  clickThroughDefault: true,
} as const;

export interface EmbodimentPlaceholder {
  consume(message: DaemonIpcMessage): OverlayUpdate;
  getCurrentUpdate(): OverlayUpdate | null;
  markIpcDisconnected(): OverlayUpdate | null;
}

function buildStateId(message: DaemonIpcMessage): string {
  return `${message.type}:${message.timestamp}:${message.state.sceneId}:${message.state.animationId}`;
}

function withFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? [...flags] : [...flags, flag];
}

function inferDeviceSurface(sceneId: string): OverlayUpdate['deviceSurface'] | undefined {
  switch (sceneId) {
    case 'desk_terminal':
      return { kind: 'terminal', contentRef: 'placeholder://terminal' };
    case 'desk_browser':
      return { kind: 'browser', contentRef: 'placeholder://browser' };
    default:
      return undefined;
  }
}

export function buildOverlayUpdateFromDaemonMessage(message: DaemonIpcMessage): OverlayUpdate {
  const flags = message.degraded ? withFlag(message.state.flags, 'degraded') : [...message.state.flags];

  return {
    stateId: buildStateId(message),
    sceneId: message.state.sceneId,
    animationId: message.state.animationId,
    visible: message.state.isVisible,
    bubbleText: undefined,
    flags,
    deviceSurface: inferDeviceSurface(message.state.sceneId),
  };
}

export function createEmbodimentPlaceholder(): EmbodimentPlaceholder {
  let current: OverlayUpdate | null = null;

  return {
    consume(message) {
      current = buildOverlayUpdateFromDaemonMessage(message);
      return current;
    },
    getCurrentUpdate() {
      return current;
    },
    markIpcDisconnected() {
      if (!current) {
        return null;
      }

      current = {
        ...current,
        flags: withFlag(current.flags, 'degraded'),
      };

      return current;
    },
  };
}
