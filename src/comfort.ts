// Comfort and locomotion rules (ADR-0012 D-5). Plain functions so they can be
// unit-tested without three.js or a headset.

export type TurnMode = "snap" | "smooth";

export interface ComfortSettings {
  turnMode: TurnMode;
  snapAngleDeg: 30 | 45 | 90;
  smoothLocomotion: boolean;
  vignette: boolean;
  seated: boolean;
  /** Extra height in metres added in seated mode so the eye line matches standing content. */
  seatedHeightOffset: number;
}

export const DEFAULT_COMFORT: Readonly<ComfortSettings> = Object.freeze({
  turnMode: "snap",
  snapAngleDeg: 45,
  smoothLocomotion: false,
  vignette: true,
  seated: false,
  seatedHeightOffset: 0.4,
});

/** Thumbstick must pass this before a snap turn fires, and return below RELEASE before the next one. */
export const SNAP_TRIGGER = 0.7;
export const SNAP_RELEASE = 0.3;

export interface SnapTurnState {
  armed: boolean;
}

/**
 * Returns the yaw change in radians for one frame of thumbstick input, and the
 * new arm state. One push gives exactly one turn, so a held stick never spins
 * the user.
 */
export function snapTurn(
  axisX: number,
  state: SnapTurnState,
  angleDeg: number,
): { deltaYaw: number; state: SnapTurnState } {
  if (!state.armed) {
    return { deltaYaw: 0, state: { armed: Math.abs(axisX) < SNAP_RELEASE } };
  }
  if (Math.abs(axisX) < SNAP_TRIGGER) return { deltaYaw: 0, state };
  const deltaYaw = -Math.sign(axisX) * (angleDeg * Math.PI) / 180;
  return { deltaYaw, state: { armed: false } };
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface TeleportTarget {
  x: number;
  y: number;
  z: number;
  /** Y component of the hit surface normal; 1 means flat floor. */
  normalY: number;
}

/** Maximum floor slope a teleport may land on, as the minimum normal Y (≈ 25°). */
export const MIN_FLOOR_NORMAL_Y = Math.cos((25 * Math.PI) / 180);
export const MAX_TELEPORT_DISTANCE = 8;

export function isValidTeleportTarget(
  target: TeleportTarget,
  from: { x: number; z: number },
  bounds: Bounds,
): boolean {
  if (![target.x, target.y, target.z, target.normalY].every(Number.isFinite)) return false;
  if (target.normalY < MIN_FLOOR_NORMAL_Y) return false;
  if (target.x < bounds.minX || target.x > bounds.maxX) return false;
  if (target.z < bounds.minZ || target.z > bounds.maxZ) return false;
  return Math.hypot(target.x - from.x, target.z - from.z) <= MAX_TELEPORT_DISTANCE;
}

/** Vignette strength 0–1 for the current movement speed in m/s; 0 when off or standing still. */
export function vignetteStrength(settings: ComfortSettings, speed: number): number {
  if (!settings.vignette || !(speed > 0)) return 0;
  return Math.min(1, 0.35 + speed / 4);
}

/** Camera rig height offset for the current posture mode. */
export function rigHeightOffset(settings: ComfortSettings): number {
  return settings.seated ? settings.seatedHeightOffset : 0;
}
