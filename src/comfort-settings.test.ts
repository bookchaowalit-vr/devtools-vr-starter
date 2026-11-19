import { describe, expect, it } from "vitest";
import { DEFAULT_COMFORT } from "./comfort";
import { COMFORT_STORAGE_KEY, loadComfort, sanitizeComfort, saveComfort } from "./comfort-settings";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const throwing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("comfort settings persistence", () => {
  it("falls back to the defaults when nothing is stored", () => {
    expect(loadComfort(memoryStorage())).toEqual(DEFAULT_COMFORT);
    expect(loadComfort(null)).toEqual(DEFAULT_COMFORT);
  });

  it("round-trips the user's choice", () => {
    const storage = memoryStorage();
    const chosen = { ...DEFAULT_COMFORT, snapAngleDeg: 90 as const, vignette: false, seated: true };
    expect(saveComfort(storage, chosen)).toBe(true);
    expect(JSON.parse(storage.data.get(COMFORT_STORAGE_KEY)!)).toEqual({ snapAngleDeg: 90, vignette: false, seated: true });
    expect(loadComfort(storage)).toEqual(chosen);
  });

  it("ignores corrupt JSON and storage that throws", () => {
    expect(loadComfort(memoryStorage({ [COMFORT_STORAGE_KEY]: "{not json" }))).toEqual(DEFAULT_COMFORT);
    expect(loadComfort(throwing)).toEqual(DEFAULT_COMFORT);
    expect(saveComfort(throwing, DEFAULT_COMFORT)).toBe(false);
    expect(saveComfort(null, DEFAULT_COMFORT)).toBe(false);
  });

  it("keeps only valid fields and never lets stored data unlock smooth locomotion", () => {
    const result = sanitizeComfort({ snapAngleDeg: 60, vignette: "yes", seated: true, smoothLocomotion: true, turnMode: "smooth" });
    expect(result).toEqual({ ...DEFAULT_COMFORT, seated: true });
    expect(sanitizeComfort(null)).toEqual(DEFAULT_COMFORT);
    expect(sanitizeComfort([30])).toEqual(DEFAULT_COMFORT);
  });

  it("accepts each offered snap angle", () => {
    for (const angle of [30, 45, 90]) expect(sanitizeComfort({ snapAngleDeg: angle }).snapAngleDeg).toBe(angle);
  });
});
