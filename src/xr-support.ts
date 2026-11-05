// What the Enter VR control should say and do, decided without touching three.js.

export type XrAvailability = "supported" | "unsupported" | "insecure" | "no-webxr";

export interface XrEnv {
  isSecureContext: boolean;
  xr?: { isSessionSupported(mode: "immersive-vr"): Promise<boolean> };
}

export async function detectXr(env: XrEnv): Promise<XrAvailability> {
  if (!env.isSecureContext) return "insecure";
  if (!env.xr) return "no-webxr";
  try {
    return (await env.xr.isSessionSupported("immersive-vr")) ? "supported" : "unsupported";
  } catch {
    return "unsupported";
  }
}

export const BUTTON_LABEL: Record<XrAvailability, string> = {
  supported: "Enter VR",
  unsupported: "VR not available on this device",
  insecure: "VR needs HTTPS",
  "no-webxr": "This browser has no WebXR",
};

/** Emulation is opt-in through ?emulate=quest3 (or quest2), for CI and desktop development. */
export function emulationTarget(search: string): "quest2" | "quest3" | null {
  const value = new URLSearchParams(search).get("emulate");
  return value === "quest2" || value === "quest3" ? value : null;
}
