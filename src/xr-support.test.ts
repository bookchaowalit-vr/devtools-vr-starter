import { describe, expect, it } from "vitest";
import { BUTTON_LABEL, detectXr, emulationTarget } from "./xr-support";

const xr = (result: boolean | Error) => ({
  isSessionSupported: async () => {
    if (result instanceof Error) throw result;
    return result;
  },
});

describe("detectXr", () => {
  it("needs a secure context first", async () => {
    expect(await detectXr({ isSecureContext: false, xr: xr(true) })).toBe("insecure");
  });

  it("reports a browser without navigator.xr", async () => {
    expect(await detectXr({ isSecureContext: true })).toBe("no-webxr");
  });

  it("asks the runtime whether immersive-vr is supported", async () => {
    expect(await detectXr({ isSecureContext: true, xr: xr(true) })).toBe("supported");
    expect(await detectXr({ isSecureContext: true, xr: xr(false) })).toBe("unsupported");
  });

  it("treats a throwing runtime as unsupported", async () => {
    expect(await detectXr({ isSecureContext: true, xr: xr(new Error("blocked")) })).toBe("unsupported");
  });

  it("has a label for every state", () => {
    expect(Object.keys(BUTTON_LABEL).sort()).toEqual(["insecure", "no-webxr", "supported", "unsupported"]);
  });
});

describe("emulationTarget", () => {
  it("accepts only the known headsets", () => {
    expect(emulationTarget("?emulate=quest3")).toBe("quest3");
    expect(emulationTarget("?emulate=quest2&x=1")).toBe("quest2");
    expect(emulationTarget("?emulate=vive")).toBeNull();
    expect(emulationTarget("")).toBeNull();
  });
});
