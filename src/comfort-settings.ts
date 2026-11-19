// Comfort choices made in the 2D page before entering VR, kept in localStorage.
// Storage can be missing or throw (private mode, blocked site data), so every
// access is guarded and the defaults always win when nothing valid is stored.
import { type ComfortSettings, DEFAULT_COMFORT } from "./comfort";

export const COMFORT_STORAGE_KEY = "vr-starter:comfort";
export const SNAP_ANGLES = [30, 45, 90] as const;

/** The subset of comfort settings the page lets the user change. */
export type ComfortChoice = Pick<ComfortSettings, "snapAngleDeg" | "vignette" | "seated">;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isSnapAngle(value: unknown): value is ComfortSettings["snapAngleDeg"] {
  return (SNAP_ANGLES as readonly unknown[]).includes(value);
}

/** Merges a stored or form value into the defaults, keeping only valid fields. */
export function sanitizeComfort(value: unknown): ComfortSettings {
  const result: ComfortSettings = { ...DEFAULT_COMFORT };
  if (typeof value !== "object" || value === null) return result;
  const input = value as Record<string, unknown>;
  if (isSnapAngle(input.snapAngleDeg)) result.snapAngleDeg = input.snapAngleDeg;
  if (typeof input.vignette === "boolean") result.vignette = input.vignette;
  if (typeof input.seated === "boolean") result.seated = input.seated;
  return result;
}

export function loadComfort(storage: StorageLike | null | undefined): ComfortSettings {
  try {
    const raw = storage?.getItem(COMFORT_STORAGE_KEY);
    return raw ? sanitizeComfort(JSON.parse(raw)) : { ...DEFAULT_COMFORT };
  } catch {
    return { ...DEFAULT_COMFORT };
  }
}

/** Returns false when the choice could not be stored; the session still uses it. */
export function saveComfort(storage: StorageLike | null | undefined, settings: ComfortSettings): boolean {
  if (!storage) return false;
  const choice: ComfortChoice = {
    snapAngleDeg: settings.snapAngleDeg,
    vignette: settings.vignette,
    seated: settings.seated,
  };
  try {
    storage.setItem(COMFORT_STORAGE_KEY, JSON.stringify(choice));
    return true;
  } catch {
    return false;
  }
}

/** Reads localStorage itself, which can throw on access in some browsers. */
export function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
