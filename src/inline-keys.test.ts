import { describe, expect, it } from "vitest";
import { KEY_ROTATE_STEP, keyRotation } from "./inline-keys";

describe("inline preview arrow keys", () => {
  it("maps each arrow to one rotation step", () => {
    expect(keyRotation("ArrowLeft")).toEqual([KEY_ROTATE_STEP, 0]);
    expect(keyRotation("ArrowRight")).toEqual([-KEY_ROTATE_STEP, 0]);
    expect(keyRotation("ArrowUp")).toEqual([0, KEY_ROTATE_STEP]);
    expect(keyRotation("ArrowDown")).toEqual([0, -KEY_ROTATE_STEP]);
  });

  it("ignores other keys so Tab and Enter keep working", () => {
    for (const key of ["Tab", "Enter", " ", "a"]) expect(keyRotation(key)).toBeNull();
  });
});
