import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMFORT,
  MAX_TELEPORT_DISTANCE,
  isValidTeleportTarget,
  rigHeightOffset,
  snapTurn,
  vignetteStrength,
} from "./comfort";

const bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
const origin = { x: 0, z: 0 };

describe("comfort defaults", () => {
  it("start with teleport-friendly, sickness-safe options", () => {
    expect(DEFAULT_COMFORT.turnMode).toBe("snap");
    expect(DEFAULT_COMFORT.smoothLocomotion).toBe(false);
    expect(DEFAULT_COMFORT.vignette).toBe(true);
  });
});

describe("snapTurn", () => {
  it("turns once per push, in the stick direction", () => {
    const right = snapTurn(0.9, { armed: true }, 45);
    expect(right.deltaYaw).toBeCloseTo(-Math.PI / 4);
    expect(right.state.armed).toBe(false);
    expect(snapTurn(-0.9, { armed: true }, 30).deltaYaw).toBeCloseTo(Math.PI / 6);
  });

  it("does not turn again while the stick is held", () => {
    expect(snapTurn(0.95, { armed: false }, 45)).toEqual({ deltaYaw: 0, state: { armed: false } });
  });

  it("re-arms only after the stick returns near centre", () => {
    expect(snapTurn(0.5, { armed: false }, 45).state.armed).toBe(false);
    expect(snapTurn(0.1, { armed: false }, 45).state.armed).toBe(true);
  });

  it("ignores small deflections", () => {
    expect(snapTurn(0.4, { armed: true }, 45)).toEqual({ deltaYaw: 0, state: { armed: true } });
  });
});

describe("isValidTeleportTarget", () => {
  it("accepts flat floor inside the bounds and range", () => {
    expect(isValidTeleportTarget({ x: 2, y: 0, z: -3, normalY: 1 }, origin, bounds)).toBe(true);
  });

  it("rejects walls and steep slopes", () => {
    expect(isValidTeleportTarget({ x: 1, y: 1, z: 1, normalY: 0 }, origin, bounds)).toBe(false);
    expect(isValidTeleportTarget({ x: 1, y: 0, z: 1, normalY: 0.8 }, origin, bounds)).toBe(false);
  });

  it("rejects points outside the play area or too far away", () => {
    expect(isValidTeleportTarget({ x: 6, y: 0, z: 0, normalY: 1 }, origin, bounds)).toBe(false);
    const far = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
    expect(isValidTeleportTarget({ x: MAX_TELEPORT_DISTANCE + 0.1, y: 0, z: 0, normalY: 1 }, origin, far)).toBe(false);
  });

  it("rejects non-finite hits", () => {
    expect(isValidTeleportTarget({ x: Number.NaN, y: 0, z: 0, normalY: 1 }, origin, bounds)).toBe(false);
  });
});

describe("vignetteStrength", () => {
  it("is zero when still or turned off", () => {
    expect(vignetteStrength(DEFAULT_COMFORT, 0)).toBe(0);
    expect(vignetteStrength({ ...DEFAULT_COMFORT, vignette: false }, 2)).toBe(0);
  });

  it("grows with speed and is capped at 1", () => {
    expect(vignetteStrength(DEFAULT_COMFORT, 1)).toBeGreaterThan(vignetteStrength(DEFAULT_COMFORT, 0.5));
    expect(vignetteStrength(DEFAULT_COMFORT, 100)).toBe(1);
  });
});

describe("rigHeightOffset", () => {
  it("raises the rig only in seated mode", () => {
    expect(rigHeightOffset(DEFAULT_COMFORT)).toBe(0);
    expect(rigHeightOffset({ ...DEFAULT_COMFORT, seated: true })).toBe(DEFAULT_COMFORT.seatedHeightOffset);
  });
});
