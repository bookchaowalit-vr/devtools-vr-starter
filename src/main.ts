import "./style.css";
import { DEFAULT_COMFORT } from "./comfort";
import { createScene } from "./scene";
import { BUTTON_LABEL, detectXr, emulationTarget } from "./xr-support";

const root = document.documentElement;
const stage = document.getElementById("stage");
const button = document.getElementById("enter-vr");
const status = document.getElementById("xr-status");
if (!(stage instanceof HTMLElement) || !(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement)) {
  throw new Error("index.html is missing #stage, #enter-vr or #xr-status");
}

async function installEmulator(target: "quest2" | "quest3") {
  // Loaded only on ?emulate=..., so the production bundle path never ships the emulator.
  const { XRDevice, metaQuest2, metaQuest3 } = await import("iwer");
  const device = new XRDevice(target === "quest2" ? metaQuest2 : metaQuest3);
  // Desktop Chromium exposes a native navigator.xr with no headset; ?emulate is an explicit opt-in, so replace it.
  device.installRuntime({ forceInstall: true });
  root.dataset.xrEmulated = target;
}

async function start() {
  const target = emulationTarget(location.search);
  if (target) await installEmulator(target);

  const starter = createScene(stage as HTMLElement);
  starter.setComfort(DEFAULT_COMFORT);
  root.dataset.xr = "inline";

  const availability = await detectXr({ isSecureContext: window.isSecureContext, xr: navigator.xr });
  root.dataset.xrAvailability = availability;
  const vrButton = button as HTMLButtonElement;
  vrButton.textContent = BUTTON_LABEL[availability];
  vrButton.disabled = availability !== "supported";
  (status as HTMLElement).textContent =
    availability === "supported" ? "Headset ready." : "Showing the 3D preview. Drag to look around.";

  let session: XRSession | null = null;
  let starting = false;
  vrButton.addEventListener("click", async () => {
    if (session) {
      await session.end();
      return;
    }
    if (starting) return;
    starting = true;
    let next: XRSession | null = null;
    try {
      next = await navigator.xr!.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      });
      await starter.renderer.xr.setSession(next);
      session = next;
      root.dataset.xr = "immersive";
      vrButton.textContent = "Exit VR";
      (status as HTMLElement).textContent = "In VR. Point at the floor and press the trigger to teleport.";
      next.addEventListener("end", () => {
        session = null;
        root.dataset.xr = "inline";
        vrButton.textContent = BUTTON_LABEL.supported;
        (status as HTMLElement).textContent = "Headset ready.";
      });
    } catch (error) {
      // The runtime granted a session but the renderer could not take it: end it so the headset is released.
      if (next) await next.end().catch(() => undefined);
      session = null;
      (status as HTMLElement).textContent = `Could not start VR: ${(error as Error).message}`;
    } finally {
      starting = false;
    }
  });
}

start().catch((error: unknown) => {
  root.dataset.xr = "error";
  (status as HTMLElement).textContent = `Something went wrong: ${(error as Error).message}`;
});
