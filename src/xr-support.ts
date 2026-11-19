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

/**
 * A message the user can act on when an immersive session fails. The raw error
 * text goes to the console, not the page.
 */
export function describeXrError(error: unknown): string {
  const name = typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Could not start VR: the browser blocked it. Allow VR in the headset browser's site settings, then press Enter VR again.";
  }
  if (name === "NotSupportedError") {
    return "Could not start VR: this headset or browser does not offer an immersive session. Try the Quest Browser.";
  }
  return "Could not start VR. Check that the headset is awake and on its guardian boundary, then press Enter VR again.";
}

/** The link to open on a headset: this page without the emulator opt-in or other query state. */
export function headsetUrl(href: string): string {
  const url = new URL(href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** The same page with the emulated Quest 3 headset switched on. */
export function emulatorUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set("emulate", "quest3");
  url.hash = "";
  return url.toString();
}
